package co.weveh.mecanicoia.infrastructure.ia;

import static org.assertj.core.api.Assertions.assertThat;

import co.weveh.mecanicoia.application.puertos.MotorDiagnostico;
import co.weveh.mecanicoia.domain.Diagnostico;
import co.weveh.mecanicoia.domain.NivelGravedad;
import co.weveh.mecanicoia.domain.Plazo;
import co.weveh.mecanicoia.domain.RolMensaje;
import co.weveh.mecanicoia.domain.ValidadorSeguridadDiagnostico;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import org.junit.jupiter.api.Tag;
import org.junit.jupiter.api.Test;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.json.JsonMapper;

/**
 * Evals del Mecánico IA contra el modelo real de OpenRouter (skill mecanico-ia). Fuera del verify normal porque gasta
 * llamadas. Correr con:  ./mvnw test -Dgroups=evals -DexcludedGroups=none
 * Requiere OPENROUTER_API_KEY y WEVEH_IA_MODELO en el entorno. Imprime la fila para evals/results.md.
 */
@Tag("evals")
class EvalsMecanicoIaTest {

    @Test
    void casosDelMecanicoIa() throws Exception {
        var json = JsonMapper.builder().build();
        var raiz = json.readTree(Files.readString(Path.of("../evals/mecanico-ia/casos.json")));
        var modelo = System.getenv().getOrDefault("WEVEH_IA_MODELO", "");
        var motor = new MotorDiagnosticoOpenRouter(json, modelo, System.getenv().getOrDefault("OPENROUTER_API_KEY", ""),
                "https://openrouter.ai/api/v1");
        var fallas = new ArrayList<String>();
        var resultados = new LinkedHashMap<String, String>();

        for (JsonNode caso : raiz.get("casos")) {
            var id = caso.get("id").asString();
            var mensaje = caso.get("mensaje").asString();
            // Mismo contexto que arma ContextoDiagnostico, incluidos los datos que la persona no ha registrado (RF-MIA-05)
            var contexto = json.writeValueAsString(Map.of(
                    "vehiculo", raiz.get("vehiculo"),
                    "datosQueFaltan", caso.has("datosQueFaltan") ? caso.get("datosQueFaltan") : json.createArrayNode()));
            var obtenida = motor.conversar(contexto, historial(caso), mensaje);
            var problemas = obtenida.map(r -> revisar(caso, mensaje, r)).orElse(List.of("el modelo no dio una respuesta válida"));
            var quien = obtenida.map(r -> " (" + r.modelo() + ")").orElse("");
            resultados.put(id, (problemas.isEmpty() ? "PASA" : "FALLA: " + String.join("; ", problemas)) + quien);
            if (!problemas.isEmpty()) {
                fallas.add(id);
            }
        }

        System.out.println("\n| Caso | Resultado |\n|---|---|");
        resultados.forEach((id, resultado) -> System.out.println("| " + id + " | " + resultado + " |"));
        System.out.println("Modelo: " + modelo + " · prompt " + MotorDiagnosticoOpenRouter.VERSION_PROMPT);
        assertThat(fallas).as("casos que fallan").isEmpty();
    }

    private static List<MotorDiagnostico.Turno> historial(JsonNode caso) {
        if (!caso.has("historial")) {
            return List.of();
        }
        return caso.get("historial").valueStream()
                .map(t -> new MotorDiagnostico.Turno(RolMensaje.valueOf(t.get("rol").asString()), t.get("texto").asString()))
                .toList();
    }

    /** La tarjeta final como la calcula ConversarConMecanicoServicio: la del modelo validada, o la de la regla. */
    private static Diagnostico tarjetaFinal(String mensaje, Diagnostico delModelo) {
        if (delModelo != null) {
            return ValidadorSeguridadDiagnostico.aplicar(mensaje, delModelo, false);
        }
        return ValidadorSeguridadDiagnostico.causaCritica(mensaje)
                .map(causa -> ValidadorSeguridadDiagnostico.tarjetaPorSenal(causa, false))
                .orElse(null);
    }

    private static List<String> revisar(JsonNode caso, String mensaje, MotorDiagnostico.Respuesta respuesta) {
        var problemas = new ArrayList<String>();
        var tarjeta = tarjetaFinal(mensaje, respuesta.diagnostico());
        var esperaTarjeta = caso.get("tarjeta");
        if (esperaTarjeta != null && esperaTarjeta.isBoolean()) {
            if (esperaTarjeta.asBoolean() && tarjeta == null) {
                problemas.add("no hubo tarjeta");
            }
            if (!esperaTarjeta.asBoolean() && tarjeta != null
                    && (tarjeta.nivelGravedad() == NivelGravedad.CRITICO || tarjeta.plazo() == Plazo.NO_MANEJAR)) {
                problemas.add("una pregunta sin síntoma salió Crítica");
            }
        }
        if (tarjeta != null && caso.has("gravedadMinima")
                && tarjeta.nivelGravedad().ordinal() < NivelGravedad.valueOf(caso.get("gravedadMinima").asString()).ordinal()) {
            problemas.add("gravedad " + tarjeta.nivelGravedad() + " menor que " + caso.get("gravedadMinima").asString());
        }
        if (tarjeta != null && caso.has("gravedadMaxima")
                && tarjeta.nivelGravedad().ordinal() > NivelGravedad.valueOf(caso.get("gravedadMaxima").asString()).ordinal()) {
            problemas.add("gravedad " + tarjeta.nivelGravedad() + " exagerada");
        }
        if (caso.has("esperaDatos") && !respuesta.texto().contains("?")
                && (tarjeta == null || tarjeta.datosFaltantes().isEmpty())) {
            problemas.add("no pidió datos");
        }
        if (caso.has("mencionaAlguna")) {
            var texto = respuesta.texto().toLowerCase(Locale.ROOT);
            var menciona = caso.get("mencionaAlguna").valueStream().anyMatch(p -> texto.contains(p.asString()));
            if (!menciona) {
                problemas.add("no usó el contexto de la conversación");
            }
        }
        return problemas;
    }
}
