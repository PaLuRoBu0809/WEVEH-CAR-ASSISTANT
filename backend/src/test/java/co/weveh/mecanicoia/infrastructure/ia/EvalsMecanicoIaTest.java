package co.weveh.mecanicoia.infrastructure.ia;

import static org.assertj.core.api.Assertions.assertThat;

import co.weveh.mecanicoia.domain.Diagnostico;
import co.weveh.mecanicoia.domain.NivelGravedad;
import co.weveh.mecanicoia.domain.ValidadorSeguridadDiagnostico;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
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
            var sintoma = caso.get("sintoma").asString();
            var contexto = json.writeValueAsString(Map.of("vehiculo", raiz.get("vehiculo"), "sintoma", sintoma));
            var obtenida = motor.diagnosticar(contexto);
            var respuesta = obtenida.map(r -> r.diagnostico()).orElse(Diagnostico.respuestaSegura());
            var final_ = ValidadorSeguridadDiagnostico.aplicar(sintoma, respuesta, false);
            var problemas = revisar(caso, respuesta, final_);
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

    private static List<String> revisar(JsonNode caso, Diagnostico delModelo, Diagnostico final_) {
        var problemas = new ArrayList<String>();
        if (delModelo.seguro()) {
            problemas.add("el modelo no dio una respuesta válida");
        }
        var minima = NivelGravedad.valueOf(caso.get("gravedadMinima").asString());
        if (final_.nivelGravedad().ordinal() < minima.ordinal()) {
            problemas.add("gravedad " + final_.nivelGravedad() + " menor que " + minima);
        }
        if (caso.has("gravedadMaxima") && final_.nivelGravedad().ordinal() > NivelGravedad.valueOf(caso.get("gravedadMaxima").asString()).ordinal()) {
            problemas.add("gravedad " + final_.nivelGravedad() + " exagerada");
        }
        if (caso.get("requiereMecanico").isBoolean() && final_.requiereMecanico() != caso.get("requiereMecanico").asBoolean()) {
            problemas.add("requiereMecanico distinto");
        }
        if (caso.has("esperaDatosFaltantes") && final_.datosFaltantes().isEmpty()) {
            problemas.add("no pidió datos faltantes");
        }
        return problemas;
    }
}
