package co.weveh.mecanicoia.infrastructure.ia;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import co.weveh.mecanicoia.domain.NivelGravedad;
import co.weveh.shared.domain.ServicioNoDisponibleException;
import org.junit.jupiter.api.Test;
import tools.jackson.databind.json.JsonMapper;

/**
 * La salida del modelo se valida contra el contrato antes de usarse (CLAUDE.md, reglas de IA 3).
 */
class MotorDiagnosticoOpenRouterTest {

    static final String SALIDA_VALIDA = """
            {"posible_falla":"Pastillas de freno desgastadas","nivel_gravedad":"Crítico",
             "explicacion_simple":"El metal roza el disco.","accion_inmediata":"Lleva el carro al taller hoy.",
             "costo_estimado":"$150.000 - $300.000 COP","requires_human_review":false,"requires_mechanic":true,
             "piezas_relacionadas":["pastillas_freno"],"datos_faltantes":[]}""";

    static MotorDiagnosticoOpenRouter motor(String llave) throws Exception {
        return new MotorDiagnosticoOpenRouter(JsonMapper.builder().build(), "anthropic/claude-sonnet-4.5", llave, "http://localhost:1");
    }

    static String respuesta(String contenido, String finishReason) {
        var escapado = JsonMapper.builder().build().writeValueAsString(contenido);
        return "{\"id\":\"x\",\"choices\":[{\"index\":0,\"finish_reason\":\"" + finishReason
                + "\",\"message\":{\"role\":\"assistant\",\"content\":" + escapado + "}}],\"usage\":{}}";
    }

    @Test
    void interpretaUnaSalidaValida() throws Exception {
        var diagnostico = motor("llave").interpretar(respuesta(SALIDA_VALIDA, "stop")).orElseThrow();

        assertThat(diagnostico.nivelGravedad()).isEqualTo(NivelGravedad.CRITICO);
        assertThat(diagnostico.requiereMecanico()).isTrue();
        assertThat(diagnostico.piezasRelacionadas()).containsExactly("pastillas_freno");
        assertThat(diagnostico.seguro()).isFalse();
    }

    @Test
    void aceptaElJsonEntreCercasDeMarkdown() throws Exception {
        assertThat(motor("llave").interpretar(respuesta("```json\n" + SALIDA_VALIDA + "\n```", "stop"))).isPresent();
    }

    @Test
    void unaGravedadFueraDelContratoSeRechaza() throws Exception {
        var invalida = SALIDA_VALIDA.replace("\"Crítico\"", "\"Grave\"");

        assertThat(motor("llave").interpretar(respuesta(invalida, "stop"))).isEmpty();
    }

    @Test
    void unaRespuestaCortadaONegadaNoSeUsa() throws Exception {
        assertThat(motor("llave").interpretar(respuesta(SALIDA_VALIDA, "length"))).isEmpty();
        assertThat(motor("llave").interpretar(respuesta(SALIDA_VALIDA, "content_filter"))).isEmpty();
    }

    @Test
    void sinCamposObligatoriosSeRechaza() throws Exception {
        assertThat(motor("llave").interpretar(respuesta("{\"nivel_gravedad\":\"Leve\"}", "stop"))).isEmpty();
    }

    @Test
    void sinLlaveAvisaQueNoEstaConfigurado() throws Exception {
        assertThatThrownBy(() -> motor("").diagnosticar("{}")).isInstanceOf(ServicioNoDisponibleException.class);
    }

    @Test
    void siOpenRouterNoRespondeDevuelveVacioParaReintentar() throws Exception {
        assertThat(motor("llave").diagnosticar("{}")).isEmpty();
    }
}
