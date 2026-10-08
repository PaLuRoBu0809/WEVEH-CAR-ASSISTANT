package co.weveh.mecanicoia.infrastructure.ia;

import co.weveh.mecanicoia.application.puertos.MotorDiagnostico;
import co.weveh.mecanicoia.domain.Diagnostico;
import co.weveh.mecanicoia.domain.NivelGravedad;
import co.weveh.shared.domain.ServicioNoDisponibleException;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import java.io.IOException;
import java.net.http.HttpClient;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.ClassPathResource;
import org.springframework.http.MediaType;
import org.springframework.http.client.JdkClientHttpRequestFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;
import tools.jackson.core.JacksonException;
import tools.jackson.databind.json.JsonMapper;

/**
 * Adaptador de OpenRouter (API compatible con OpenAI, docs/adr/0004). Único lugar donde aparece el proveedor de IA.
 * Pide salida estructurada con el esquema del contrato y, aun así, la valida aquí.
 */
@Component
class MotorDiagnosticoOpenRouter implements MotorDiagnostico {

    static final String VERSION_PROMPT = "mecanico-v1";
    private static final Logger LOG = LoggerFactory.getLogger(MotorDiagnosticoOpenRouter.class);
    private static final Duration ESPERA_MAXIMA = Duration.ofSeconds(25);
    private static final List<String> NIVELES = List.of("Crítico", "Moderado", "Leve");

    private final RestClient cliente;
    private final JsonMapper json;
    private final String modelo;
    private final String llave;
    private final String prompt;

    MotorDiagnosticoOpenRouter(JsonMapper json,
                               @Value("${weveh.ia.modelo:}") String modelo,
                               @Value("${weveh.ia.openrouter.llave:}") String llave,
                               @Value("${weveh.ia.openrouter.url:https://openrouter.ai/api/v1}") String url) throws IOException {
        this.json = json;
        this.modelo = modelo.strip();
        this.llave = llave.strip();
        this.prompt = new ClassPathResource("prompts/" + VERSION_PROMPT + ".md").getContentAsString(StandardCharsets.UTF_8);
        var fabrica = new JdkClientHttpRequestFactory(HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(5)).build());
        fabrica.setReadTimeout(ESPERA_MAXIMA);
        this.cliente = RestClient.builder()
                .baseUrl(url)
                .requestFactory(fabrica)
                .defaultHeader("X-Title", "WEVEH")
                .build();
    }

    @Override
    public Optional<Diagnostico> diagnosticar(String contextoJson) {
        if (llave.isEmpty() || modelo.isEmpty()) {
            throw new ServicioNoDisponibleException("El Mecánico IA todavía no está configurado. Intenta más tarde.");
        }
        try {
            var cuerpo = json.writeValueAsString(solicitud(contextoJson));
            var texto = cliente.post()
                    .uri("/chat/completions")
                    .header("Authorization", "Bearer " + llave)
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(cuerpo)
                    .retrieve()
                    .body(String.class);
            return interpretar(texto);
        } catch (RestClientException | JacksonException error) {
            LOG.warn("OpenRouter no respondió algo utilizable: {}", error.getMessage());
            return Optional.empty();
        }
    }

    private Map<String, Object> solicitud(String contextoJson) {
        return Map.of(
                "model", modelo,
                "temperature", 0.2,
                "max_tokens", 900,
                "messages", List.of(
                        Map.of("role", "system", "content", prompt),
                        Map.of("role", "user", "content", contextoJson)),
                "response_format", Map.of(
                        "type", "json_schema",
                        "json_schema", Map.of("name", "diagnostico_mecanico_preventivo", "strict", true, "schema", ESQUEMA)));
    }

    Optional<Diagnostico> interpretar(String respuesta) {
        var completado = json.readValue(respuesta, Completado.class);
        if (completado.choices() == null || completado.choices().isEmpty()) {
            return Optional.empty();
        }
        var opcion = completado.choices().getFirst();
        // "length" = se cortó; "content_filter" = el modelo se negó: nunca un diagnóstico a medias (skill mecanico-ia)
        if (opcion.message() == null || !"stop".equals(opcion.finishReason())) {
            return Optional.empty();
        }
        return aDiagnostico(sinCercas(opcion.message().content()));
    }

    Optional<Diagnostico> aDiagnostico(String contenido) {
        if (contenido == null || contenido.isBlank()) {
            return Optional.empty();
        }
        var salida = json.readValue(contenido, SalidaModelo.class);
        if (vacio(salida.posibleFalla()) || vacio(salida.explicacionSimple()) || vacio(salida.accionInmediata())
                || !NIVELES.contains(salida.nivelGravedad())) {
            return Optional.empty();
        }
        var nivel = NivelGravedad.desdeTexto(salida.nivelGravedad()).orElseThrow();
        return Optional.of(new Diagnostico(salida.posibleFalla().strip(), nivel, salida.explicacionSimple().strip(),
                salida.accionInmediata().strip(), vacio(salida.costoEstimado()) ? null : salida.costoEstimado().strip(),
                Boolean.TRUE.equals(salida.requiresHumanReview()), Boolean.TRUE.equals(salida.requiresMechanic()),
                salida.piezasRelacionadas(), salida.datosFaltantes(), false));
    }

    private static String sinCercas(String contenido) {
        if (contenido == null) {
            return null;
        }
        return contenido.strip().replaceFirst("^```(?:json)?\\s*", "").replaceFirst("\\s*```$", "");
    }

    private static boolean vacio(String texto) {
        return texto == null || texto.isBlank();
    }

    @Override
    public String modelo() {
        return modelo;
    }

    @Override
    public String versionPrompt() {
        return VERSION_PROMPT;
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
    record SalidaModelo(
            @JsonProperty("posible_falla") String posibleFalla,
            @JsonProperty("nivel_gravedad") String nivelGravedad,
            @JsonProperty("explicacion_simple") String explicacionSimple,
            @JsonProperty("accion_inmediata") String accionInmediata,
            @JsonProperty("costo_estimado") String costoEstimado,
            @JsonProperty("requires_human_review") Boolean requiresHumanReview,
            @JsonProperty("requires_mechanic") Boolean requiresMechanic,
            @JsonProperty("piezas_relacionadas") List<String> piezasRelacionadas,
            @JsonProperty("datos_faltantes") List<String> datosFaltantes) {
    }

    /** Esquema del contrato (contracts/diagnostico.schema.json). */
    static final Map<String, Object> ESQUEMA = Map.of(
            "type", "object",
            "additionalProperties", false,
            "required", List.of("posible_falla", "nivel_gravedad", "explicacion_simple", "accion_inmediata",
                    "costo_estimado", "requires_human_review", "requires_mechanic", "piezas_relacionadas", "datos_faltantes"),
            "properties", Map.of(
                    "posible_falla", Map.of("type", "string"),
                    "nivel_gravedad", Map.of("type", "string", "enum", NIVELES),
                    "explicacion_simple", Map.of("type", "string"),
                    "accion_inmediata", Map.of("type", "string"),
                    "costo_estimado", Map.of("type", List.of("string", "null")),
                    "requires_human_review", Map.of("type", "boolean"),
                    "requires_mechanic", Map.of("type", "boolean"),
                    "piezas_relacionadas", Map.of("type", "array", "items", Map.of("type", "string")),
                    "datos_faltantes", Map.of("type", "array", "items", Map.of("type", "string"))));
}
