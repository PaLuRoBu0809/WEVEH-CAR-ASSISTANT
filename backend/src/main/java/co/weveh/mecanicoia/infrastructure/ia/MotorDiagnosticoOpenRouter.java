package co.weveh.mecanicoia.infrastructure.ia;

import co.weveh.mecanicoia.application.puertos.MotorDiagnostico;
import co.weveh.mecanicoia.domain.DetectorIngles;
import co.weveh.mecanicoia.domain.Diagnostico;
import co.weveh.mecanicoia.domain.NivelGravedad;
import co.weveh.mecanicoia.domain.RolMensaje;
import co.weveh.shared.domain.ServicioNoDisponibleException;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import java.io.IOException;
import java.net.http.HttpClient;
import java.nio.charset.StandardCharsets;
import java.text.Normalizer;
import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Optional;
import java.util.regex.Pattern;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.ClassPathResource;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.client.JdkClientHttpRequestFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestClientResponseException;
import tools.jackson.core.JacksonException;
import tools.jackson.databind.json.JsonMapper;

/**
 * Adaptador de OpenRouter (API compatible con OpenAI, docs/adr/0004). Único lugar donde aparece el proveedor de IA.
 *
 * <p>Con el plan gratis los modelos ":free" se saturan o se limitan a menudo, así que WEVEH_IA_MODELO es una lista en
 * orden de preferencia: si un modelo no responde, responde con error o devuelve algo que no cumple el contrato, se
 * prueba el siguiente, hasta agotar la lista o el tiempo máximo. Una llave inválida corta todo: no se queman intentos.
 *
 * <p>RF-MIA-02: cada turno manda, en este orden, las instrucciones con los datos del vehículo (lo fijo, para la caché),
 * los últimos mensajes de la conversación y el mensaje nuevo.
 */
@Component
class MotorDiagnosticoOpenRouter implements MotorDiagnostico {

    static final String VERSION_PROMPT = "mecanico-v3";
    private static final Logger LOG = LoggerFactory.getLogger(MotorDiagnosticoOpenRouter.class);
    private static final Duration ESPERA_POR_MODELO = Duration.ofSeconds(20);
    private static final Duration ESPERA_TOTAL = Duration.ofSeconds(45);
    private static final List<String> NIVELES = List.of("Crítico", "Moderado", "Leve");
    /** "¿Por qué importa?" en máximo 2 oraciones (RF-MIA-01): lo que sobre se recorta. */
    private static final int MAXIMO_ORACIONES = 2;
    private static final Pattern FIN_DE_ORACION = Pattern.compile("(?<=[.!?])\\s+");

    private final RestClient cliente;
    private final JsonMapper json;
    private final List<String> modelos;
    private final String llave;
    private final String prompt;
    private final Clock reloj;

    @Autowired
    MotorDiagnosticoOpenRouter(JsonMapper json,
                               @Value("${weveh.ia.modelo:}") String modelos,
                               @Value("${weveh.ia.openrouter.llave:}") String llave,
                               @Value("${weveh.ia.openrouter.url:https://openrouter.ai/api/v1}") String url) throws IOException {
        this(json, modelos, llave, RestClient.builder()
                .baseUrl(url)
                .requestFactory(fabrica())
                .defaultHeader("X-Title", "WEVEH")
                .build(), Clock.systemUTC());
    }

    MotorDiagnosticoOpenRouter(JsonMapper json, String modelos, String llave, RestClient cliente, Clock reloj) throws IOException {
        this.json = json;
        this.modelos = Arrays.stream(modelos.split(",")).map(String::strip).filter(modelo -> !modelo.isEmpty()).toList();
        this.llave = llave.strip();
        this.cliente = cliente;
        this.reloj = reloj;
        this.prompt = new ClassPathResource("prompts/" + VERSION_PROMPT + ".md").getContentAsString(StandardCharsets.UTF_8);
    }

    private static JdkClientHttpRequestFactory fabrica() {
        var fabrica = new JdkClientHttpRequestFactory(HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(5)).build());
        fabrica.setReadTimeout(ESPERA_POR_MODELO);
        return fabrica;
    }

    @Override
    public Optional<Respuesta> conversar(String contextoVehiculoJson, List<Turno> historial, String mensaje) {
        if (llave.isEmpty() || modelos.isEmpty()) {
            throw new ServicioNoDisponibleException("El Mecánico IA todavía no está configurado. Intenta más tarde.");
        }
        var mensajes = mensajes(contextoVehiculoJson, historial, mensaje);
        var limite = Instant.now(reloj).plus(ESPERA_TOTAL);
        for (var modelo : modelos) {
            if (Instant.now(reloj).isAfter(limite)) {
                LOG.warn("Se acabó el tiempo antes de probar {}", modelo);
                break;
            }
            var salida = probar(modelo, mensajes);
            if (salida.isPresent()) {
                return salida.map(s -> new Respuesta(s.texto(), s.diagnostico(), modelo));
            }
        }
        return Optional.empty();
    }

    /** Lo fijo primero (instrucciones y vehículo) y lo que cambia al final, para aprovechar la caché del proveedor. */
    private List<MensajeChat> mensajes(String contextoVehiculoJson, List<Turno> historial, String mensaje) {
        var mensajes = new ArrayList<MensajeChat>();
        mensajes.add(new MensajeChat("system", prompt + "\n\nDatos del vehículo:\n" + contextoVehiculoJson));
        for (var turno : historial) {
            mensajes.add(new MensajeChat(turno.rol() == RolMensaje.PERSONA ? "user" : "assistant", turno.texto()));
        }
        mensajes.add(new MensajeChat("user", mensaje));
        return mensajes;
    }

    private Optional<Salida> probar(String modelo, List<MensajeChat> mensajes) {
        try {
            return interpretar(llamar(modelo, mensajes, true));
        } catch (RestClientResponseException error) {
            var estado = error.getStatusCode();
            if (estado.isSameCodeAs(HttpStatus.UNAUTHORIZED) || estado.isSameCodeAs(HttpStatus.FORBIDDEN)) {
                throw new ServicioNoDisponibleException("La llave de OpenRouter no es válida. Revisa la configuración.");
            }
            if (estado.isSameCodeAs(HttpStatus.BAD_REQUEST)) {
                // Algunos modelos gratis no aceptan response_format: se reintenta el mismo modelo solo con el prompt
                return reintentarSinEsquema(modelo, mensajes);
            }
            LOG.warn("OpenRouter respondió {} con {}; se prueba el siguiente modelo", estado.value(), modelo);
            return Optional.empty();
        } catch (RestClientException | JacksonException error) {
            LOG.warn("{} no respondió algo utilizable ({}); se prueba el siguiente modelo", modelo, error.getMessage());
            return Optional.empty();
        }
    }

    private Optional<Salida> reintentarSinEsquema(String modelo, List<MensajeChat> mensajes) {
        try {
            return interpretar(llamar(modelo, mensajes, false));
        } catch (RestClientException | JacksonException error) {
            LOG.warn("{} tampoco respondió sin esquema ({})", modelo, error.getMessage());
            return Optional.empty();
        }
    }

    private String llamar(String modelo, List<MensajeChat> mensajes, boolean conEsquema) {
        return cliente.post()
                .uri("/chat/completions")
                .header("Authorization", "Bearer " + llave)
                .contentType(MediaType.APPLICATION_JSON)
                .body(json.writeValueAsString(solicitud(modelo, mensajes, conEsquema)))
                .retrieve()
                .body(String.class);
    }

    private Map<String, Object> solicitud(String modelo, List<MensajeChat> mensajes, boolean conEsquema) {
        var cuerpo = new LinkedHashMap<String, Object>();
        cuerpo.put("model", modelo);
        cuerpo.put("temperature", 0.2);
        cuerpo.put("max_tokens", 1200);
        cuerpo.put("messages", mensajes);
        if (conEsquema) {
            cuerpo.put("response_format", Map.of(
                    "type", "json_schema",
                    "json_schema", Map.of("name", "conversacion_mecanico", "strict", true, "schema", ESQUEMA)));
        }
        return cuerpo;
    }

    Optional<Salida> interpretar(String respuesta) {
        var completado = json.readValue(respuesta, Completado.class);
        if (completado.choices() == null || completado.choices().isEmpty()) {
            return Optional.empty();
        }
        var opcion = completado.choices().getFirst();
        // "length" = se cortó; "content_filter" = el modelo se negó: nunca una respuesta a medias (skill mecanico-ia)
        if (opcion.message() == null || !"stop".equals(opcion.finishReason())) {
            return Optional.empty();
        }
        return aSalida(soloElObjeto(opcion.message().content()));
    }

    /** La respuesta conversacional es obligatoria; la tarjeta, si viene, debe cumplir el contrato o se descarta todo. */
    Optional<Salida> aSalida(String contenido) {
        if (contenido == null || contenido.isBlank()) {
            return Optional.empty();
        }
        var salida = json.readValue(contenido, SalidaModelo.class);
        if (vacio(salida.respuesta())) {
            return Optional.empty();
        }
        // RF-MIA-01: la app habla español; una respuesta con inglés no se muestra y se prueba el siguiente modelo
        if (DetectorIngles.tieneIngles(salida.respuesta())) {
            LOG.warn("La respuesta trae palabras en inglés; se descarta");
            return Optional.empty();
        }
        if (salida.diagnostico() == null) {
            return Optional.of(new Salida(salida.respuesta().strip(), null));
        }
        return aDiagnostico(salida.diagnostico()).map(d -> new Salida(salida.respuesta().strip(), d));
    }

    Optional<Diagnostico> aDiagnostico(SalidaDiagnostico salida) {
        var pasos = salida.pasos() == null ? List.<String>of()
                : salida.pasos().stream().filter(paso -> !vacio(paso)).map(String::strip).toList();
        if (vacio(salida.posibleFalla()) || vacio(salida.porQueImporta()) || pasos.isEmpty()
                || !NIVELES.contains(salida.nivelGravedad())) {
            return Optional.empty();
        }
        var textos = new ArrayList<String>(List.of(salida.posibleFalla(), salida.porQueImporta()));
        textos.addAll(pasos);
        if (textos.stream().anyMatch(DetectorIngles::tieneIngles)) {
            LOG.warn("La tarjeta trae palabras en inglés; se descarta");
            return Optional.empty();
        }
        var nivel = NivelGravedad.desdeTexto(salida.nivelGravedad()).orElseThrow();
        return Optional.of(new Diagnostico(salida.posibleFalla().strip(), nivel, maximoDosOraciones(salida.porQueImporta()),
                pasos, Boolean.TRUE.equals(salida.requiereRevisionHumana()), Boolean.TRUE.equals(salida.requiereMecanico()),
                piezasNormalizadas(salida.piezasRelacionadas()), salida.datosFaltantes(), false));
    }

    static String maximoDosOraciones(String texto) {
        var oraciones = FIN_DE_ORACION.split(texto.strip());
        return String.join(" ", Arrays.copyOf(oraciones, Math.min(oraciones.length, MAXIMO_ORACIONES)));
    }

    /** "Válvulas de Admisión" → "valvulas_de_admision": la app las muestra y mantenimiento las cruza con el plan. */
    static List<String> piezasNormalizadas(List<String> piezas) {
        if (piezas == null) {
            return List.of();
        }
        return piezas.stream()
                .filter(pieza -> !vacio(pieza))
                .map(pieza -> Normalizer.normalize(pieza.strip(), Normalizer.Form.NFKD).replaceAll("\\p{M}", "")
                        .toLowerCase(Locale.ROOT).replaceAll("[^a-z0-9]+", "_").replaceAll("^_", "").replaceAll("_$", ""))
                .filter(pieza -> !pieza.isEmpty())
                .distinct()
                .toList();
    }

    /** Modelos sin salida estructurada a veces envuelven el JSON en markdown o texto: se toma solo el objeto. */
    static String soloElObjeto(String contenido) {
        if (contenido == null) {
            return null;
        }
        var inicio = contenido.indexOf('{');
        var fin = contenido.lastIndexOf('}');
        return inicio >= 0 && fin > inicio ? contenido.substring(inicio, fin + 1) : null;
    }

    private static boolean vacio(String texto) {
        return texto == null || texto.isBlank();
    }

    @Override
    public String modelos() {
        return String.join(",", modelos);
    }

    @Override
    public String versionPrompt() {
        return VERSION_PROMPT;
    }

    /** Un mensaje de la API de chat; un record para que el JSON salga siempre con "role" antes de "content". */
    record MensajeChat(String role, String content) {
    }

    /** Lo que sale de un modelo ya validado: el texto y, si hubo síntoma, la tarjeta sin plazo. */
    record Salida(String texto, Diagnostico diagnostico) {
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    record Completado(List<Opcion> choices) {
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    record Opcion(Mensaje message, @JsonProperty("finish_reason") String finishReason) {
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    record Mensaje(String content) {
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    record SalidaModelo(@JsonProperty("respuesta") String respuesta,
                        @JsonProperty("diagnostico") SalidaDiagnostico diagnostico) {
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    record SalidaDiagnostico(
            @JsonProperty("posible_falla") String posibleFalla,
            @JsonProperty("nivel_gravedad") String nivelGravedad,
            @JsonProperty("por_que_importa") String porQueImporta,
            @JsonProperty("pasos") List<String> pasos,
            @JsonProperty("requiere_revision_humana") Boolean requiereRevisionHumana,
            @JsonProperty("requiere_mecanico") Boolean requiereMecanico,
            @JsonProperty("piezas_relacionadas") List<String> piezasRelacionadas,
            @JsonProperty("datos_faltantes") List<String> datosFaltantes) {
    }

    private static final Map<String, Object> TEXTO = Map.of("type", "string");
    private static final Map<String, Object> SI_O_NO = Map.of("type", "boolean");
    private static final Map<String, Object> LISTA_DE_TEXTOS = Map.of("type", "array", "items", TEXTO);

    /** Tarjeta del contrato diagnostico_mecanico_preventivo (v2): nombres en español, pasos y sin precio. */
    static final Map<String, Object> ESQUEMA_DIAGNOSTICO = Map.of(
            "type", "object",
            "additionalProperties", false,
            "required", List.of("posible_falla", "nivel_gravedad", "por_que_importa", "pasos", "requiere_revision_humana",
                    "requiere_mecanico", "piezas_relacionadas", "datos_faltantes"),
            "properties", Map.of(
                    "posible_falla", TEXTO,
                    "nivel_gravedad", Map.of("type", "string", "enum", NIVELES),
                    "por_que_importa", TEXTO,
                    "pasos", Map.of("type", "array", "items", TEXTO, "minItems", 1, "maxItems", Diagnostico.MAXIMO_PASOS),
                    "requiere_revision_humana", SI_O_NO,
                    "requiere_mecanico", SI_O_NO,
                    "piezas_relacionadas", LISTA_DE_TEXTOS,
                    "datos_faltantes", LISTA_DE_TEXTOS));

    /** Contrato de mecanico-v3: la respuesta conversacional y la tarjeta solo cuando hay un síntoma. */
    static final Map<String, Object> ESQUEMA = Map.of(
            "type", "object",
            "additionalProperties", false,
            "required", List.of("respuesta", "diagnostico"),
            "properties", Map.of(
                    "respuesta", TEXTO,
                    "diagnostico", Map.of("anyOf", List.of(ESQUEMA_DIAGNOSTICO, Map.of("type", "null")))));
}
