package co.weveh.mecanicoia.infrastructure.ia;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.content;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.header;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.requestTo;
import static org.springframework.test.web.client.response.MockRestResponseCreators.withStatus;
import static org.springframework.test.web.client.response.MockRestResponseCreators.withSuccess;

import co.weveh.mecanicoia.domain.NivelGravedad;
import co.weveh.shared.domain.ServicioNoDisponibleException;
import java.time.Clock;
import org.hamcrest.Matchers;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.test.web.client.ExpectedCount;
import org.springframework.test.web.client.MockRestServiceServer;
import org.springframework.web.client.RestClient;
import tools.jackson.databind.json.JsonMapper;

/**
 * La salida del modelo se valida contra el contrato (CLAUDE.md, reglas de IA 3) y, con el plan gratis, se recorre la
 * lista de modelos hasta que uno responda bien.
 */
class MotorDiagnosticoOpenRouterTest {

    static final String URL = "https://openrouter.test/api/v1/chat/completions";
    static final JsonMapper JSON = JsonMapper.builder().build();
    static final String SALIDA_VALIDA = """
            {"posible_falla":"Pastillas de freno desgastadas","nivel_gravedad":"Crítico",
             "explicacion_simple":"El metal roza el disco.","accion_inmediata":"Lleva el carro al taller hoy.",
             "costo_estimado":"$150.000 - $300.000 COP","requires_human_review":false,"requires_mechanic":true,
             "piezas_relacionadas":["pastillas_freno"],"datos_faltantes":[]}""";

    final RestClient.Builder constructor = RestClient.builder().baseUrl("https://openrouter.test/api/v1");
    final MockRestServiceServer servidor = MockRestServiceServer.bindTo(constructor).build();

    MotorDiagnosticoOpenRouter motor(String modelos, String llave) throws Exception {
        return new MotorDiagnosticoOpenRouter(JSON, modelos, llave, constructor.build(), Clock.systemUTC());
    }

    static String respuesta(String contenido, String finishReason) {
        return "{\"id\":\"x\",\"choices\":[{\"index\":0,\"finish_reason\":\"" + finishReason
                + "\",\"message\":{\"role\":\"assistant\",\"content\":" + JSON.writeValueAsString(contenido) + "}}]}";
    }

    @Test
    void interpretaUnaSalidaValida() throws Exception {
        var diagnostico = motor("a:free", "llave").interpretar(respuesta(SALIDA_VALIDA, "stop")).orElseThrow();

        assertThat(diagnostico.nivelGravedad()).isEqualTo(NivelGravedad.CRITICO);
        assertThat(diagnostico.requiereMecanico()).isTrue();
        assertThat(diagnostico.piezasRelacionadas()).containsExactly("pastillas_freno");
    }

    @Test
    void tomaElJsonAunqueVengaConTextoOMarkdownAlrededor() throws Exception {
        var conTexto = "Claro, aquí está:\n```json\n" + SALIDA_VALIDA + "\n```";

        assertThat(motor("a:free", "llave").interpretar(respuesta(conTexto, "stop"))).isPresent();
    }

    @Test
    void rechazaGravedadFueraDelContratoRespuestaCortadaOCamposFaltantes() throws Exception {
        var motor = motor("a:free", "llave");

        assertThat(motor.interpretar(respuesta(SALIDA_VALIDA.replace("\"Crítico\"", "\"Grave\""), "stop"))).isEmpty();
        assertThat(motor.interpretar(respuesta(SALIDA_VALIDA, "length"))).isEmpty();
        assertThat(motor.interpretar(respuesta("{\"nivel_gravedad\":\"Leve\"}", "stop"))).isEmpty();
    }

    @Test
    void siElPrimerModeloEstaSaturadoUsaElSiguiente() throws Exception {
        servidor.expect(requestTo(URL)).andExpect(content().string(Matchers.containsString("\"model\":\"a:free\"")))
                .andRespond(withStatus(HttpStatus.TOO_MANY_REQUESTS));
        servidor.expect(requestTo(URL)).andExpect(content().string(Matchers.containsString("\"model\":\"b:free\"")))
                .andExpect(header("Authorization", "Bearer llave"))
                .andRespond(withSuccess(respuesta(SALIDA_VALIDA, "stop"), MediaType.APPLICATION_JSON));

        var respuesta = motor("a:free, b:free", "llave").diagnosticar("{}").orElseThrow();

        assertThat(respuesta.modelo()).isEqualTo("b:free");
        servidor.verify();
    }

    @Test
    void siUnModeloRespondeAlgoInvalidoPruebaElSiguiente() throws Exception {
        servidor.expect(requestTo(URL)).andRespond(withSuccess(respuesta("no sé", "stop"), MediaType.APPLICATION_JSON));
        servidor.expect(requestTo(URL)).andRespond(withSuccess(respuesta(SALIDA_VALIDA, "stop"), MediaType.APPLICATION_JSON));

        assertThat(motor("a:free,b:free", "llave").diagnosticar("{}").orElseThrow().modelo()).isEqualTo("b:free");
    }

    @Test
    void siElModeloNoAceptaElEsquemaReintentaSinEl() throws Exception {
        servidor.expect(requestTo(URL)).andExpect(content().string(Matchers.containsString("response_format")))
                .andRespond(withStatus(HttpStatus.BAD_REQUEST));
        servidor.expect(requestTo(URL)).andExpect(content().string(Matchers.not(Matchers.containsString("response_format"))))
                .andRespond(withSuccess(respuesta(SALIDA_VALIDA, "stop"), MediaType.APPLICATION_JSON));

        assertThat(motor("a:free", "llave").diagnosticar("{}").orElseThrow().modelo()).isEqualTo("a:free");
    }

    @Test
    void siNingunModeloRespondeDevuelveVacio() throws Exception {
        servidor.expect(ExpectedCount.times(2), requestTo(URL)).andRespond(withStatus(HttpStatus.SERVICE_UNAVAILABLE));

        assertThat(motor("a:free,b:free", "llave").diagnosticar("{}")).isEmpty();
    }

    @Test
    void unaLlaveInvalidaCortaSinProbarMasModelos() throws Exception {
        servidor.expect(ExpectedCount.once(), requestTo(URL)).andRespond(withStatus(HttpStatus.UNAUTHORIZED));

        assertThatThrownBy(() -> motor("a:free,b:free", "mala").diagnosticar("{}"))
                .isInstanceOf(ServicioNoDisponibleException.class)
                .hasMessageContaining("llave");
        servidor.verify();
    }

    @Test
    void sinLlaveOSinModelosAvisaQueNoEstaConfigurado() throws Exception {
        assertThatThrownBy(() -> motor("a:free", "").diagnosticar("{}")).isInstanceOf(ServicioNoDisponibleException.class);
        assertThatThrownBy(() -> motor(" , ", "llave").diagnosticar("{}")).isInstanceOf(ServicioNoDisponibleException.class);
    }
}
