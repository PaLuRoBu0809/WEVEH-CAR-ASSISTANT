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
import co.weveh.mecanicoia.application.puertos.MotorDiagnostico.Turno;
import co.weveh.mecanicoia.domain.RolMensaje;
import java.time.Clock;
import java.util.List;
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
    static final String DIAGNOSTICO = """
            {"posible_falla":"Pastillas de freno desgastadas","nivel_gravedad":"Crítico",
             "por_que_importa":"El metal roza el disco.","pasos":["Lleva el carro al taller hoy."],
             "requiere_revision_humana":false,"requiere_mecanico":true,
             "piezas_relacionadas":["pastillas_freno"],"datos_faltantes":[]}""";
    static final String SALIDA_VALIDA = "{\"respuesta\":\"Ese chillido podría venir de las pastillas.\",\"diagnostico\":"
            + DIAGNOSTICO + "}";
    static final String SOLO_TEXTO = "{\"respuesta\":\"Suele ser cada 5.000 a 10.000 km, según el aceite.\",\"diagnostico\":null}";

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
        var diagnostico = motor("a:free", "llave").interpretar(respuesta(SALIDA_VALIDA, "stop")).orElseThrow().diagnostico();

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
    void sinPasosNoEsUnaRespuestaValida() throws Exception {
        var sinPasos = SALIDA_VALIDA.replace("[\"Lleva el carro al taller hoy.\"]", "[]");

        assertThat(motor("a:free", "llave").interpretar(respuesta(sinPasos, "stop"))).isEmpty();
    }

    @Test
    void unaRespuestaConInglesNoSeMuestra() throws Exception {
        var conIngles = SALIDA_VALIDA.replace("El metal roza el disco.", "No se sabe lo que está happening.");

        assertThat(motor("a:free", "llave").interpretar(respuesta(conIngles, "stop"))).isEmpty();
    }

    @Test
    void siUnModeloRespondeEnInglesPruebaElSiguiente() throws Exception {
        var conIngles = SALIDA_VALIDA.replace("Lleva el carro al taller hoy.", "Check the brakes today.");
        servidor.expect(requestTo(URL)).andRespond(withSuccess(respuesta(conIngles, "stop"), MediaType.APPLICATION_JSON));
        servidor.expect(requestTo(URL)).andRespond(withSuccess(respuesta(SALIDA_VALIDA, "stop"), MediaType.APPLICATION_JSON));

        assertThat(motor("a:free,b:free", "llave").conversar("{}", List.of(), "hola").orElseThrow().modelo()).isEqualTo("b:free");
    }

    @Test
    void recortaLaExplicacionLosPasosYNormalizaLasPiezas() throws Exception {
        var larga = SALIDA_VALIDA
                .replace("El metal roza el disco.", "El metal roza el disco. Eso lo raya. Y frenar cuesta más.")
                .replace("[\"Lleva el carro al taller hoy.\"]", "[\"Uno.\",\"Dos.\",\"Tres.\",\"Cuatro.\"]")
                .replace("[\"pastillas_freno\"]", "[\"Pastillas de Freno\",\"válvulas\"]");

        var diagnostico = motor("a:free", "llave").interpretar(respuesta(larga, "stop")).orElseThrow().diagnostico();

        assertThat(diagnostico.explicacionSimple()).isEqualTo("El metal roza el disco. Eso lo raya.");
        assertThat(diagnostico.pasos()).containsExactly("Uno.", "Dos.", "Tres.");
        assertThat(diagnostico.piezasRelacionadas()).containsExactly("pastillas_de_freno", "valvulas");
    }

    @Test
    void siElPrimerModeloEstaSaturadoUsaElSiguiente() throws Exception {
        servidor.expect(requestTo(URL)).andExpect(content().string(Matchers.containsString("\"model\":\"a:free\"")))
                .andRespond(withStatus(HttpStatus.TOO_MANY_REQUESTS));
        servidor.expect(requestTo(URL)).andExpect(content().string(Matchers.containsString("\"model\":\"b:free\"")))
                .andExpect(header("Authorization", "Bearer llave"))
                .andRespond(withSuccess(respuesta(SALIDA_VALIDA, "stop"), MediaType.APPLICATION_JSON));

        var respuesta = motor("a:free, b:free", "llave").conversar("{}", List.of(), "hola").orElseThrow();

        assertThat(respuesta.modelo()).isEqualTo("b:free");
        servidor.verify();
    }

    @Test
    void siUnModeloRespondeAlgoInvalidoPruebaElSiguiente() throws Exception {
        servidor.expect(requestTo(URL)).andRespond(withSuccess(respuesta("no sé", "stop"), MediaType.APPLICATION_JSON));
        servidor.expect(requestTo(URL)).andRespond(withSuccess(respuesta(SALIDA_VALIDA, "stop"), MediaType.APPLICATION_JSON));

        assertThat(motor("a:free,b:free", "llave").conversar("{}", List.of(), "hola").orElseThrow().modelo()).isEqualTo("b:free");
    }

    @Test
    void siElModeloNoAceptaElEsquemaReintentaSinEl() throws Exception {
        servidor.expect(requestTo(URL)).andExpect(content().string(Matchers.containsString("response_format")))
                .andRespond(withStatus(HttpStatus.BAD_REQUEST));
        servidor.expect(requestTo(URL)).andExpect(content().string(Matchers.not(Matchers.containsString("response_format"))))
                .andRespond(withSuccess(respuesta(SALIDA_VALIDA, "stop"), MediaType.APPLICATION_JSON));

        assertThat(motor("a:free", "llave").conversar("{}", List.of(), "hola").orElseThrow().modelo()).isEqualTo("a:free");
    }

    @Test
    void siNingunModeloRespondeDevuelveVacio() throws Exception {
        servidor.expect(ExpectedCount.times(2), requestTo(URL)).andRespond(withStatus(HttpStatus.SERVICE_UNAVAILABLE));

        assertThat(motor("a:free,b:free", "llave").conversar("{}", List.of(), "hola")).isEmpty();
    }

    @Test
    void unaLlaveInvalidaCortaSinProbarMasModelos() throws Exception {
        servidor.expect(ExpectedCount.once(), requestTo(URL)).andRespond(withStatus(HttpStatus.UNAUTHORIZED));

        assertThatThrownBy(() -> motor("a:free,b:free", "mala").conversar("{}", List.of(), "hola"))
                .isInstanceOf(ServicioNoDisponibleException.class)
                .hasMessageContaining("llave");
        servidor.verify();
    }

    @Test
    void sinLlaveOSinModelosAvisaQueNoEstaConfigurado() throws Exception {
        assertThatThrownBy(() -> motor("a:free", "").conversar("{}", List.of(), "hola")).isInstanceOf(ServicioNoDisponibleException.class);
        assertThatThrownBy(() -> motor(" , ", "llave").conversar("{}", List.of(), "hola")).isInstanceOf(ServicioNoDisponibleException.class);
    }

    @Test
    void unaPreguntaSinSintomaEsSoloTexto() throws Exception {
        var salida = motor("a:free", "llave").interpretar(respuesta(SOLO_TEXTO, "stop")).orElseThrow();

        assertThat(salida.texto()).startsWith("Suele ser");
        assertThat(salida.diagnostico()).isNull();
    }

    @Test
    void sinRespuestaConversacionalNoEsValida() throws Exception {
        var sinTexto = SALIDA_VALIDA.replace("Ese chillido podría venir de las pastillas.", " ");

        assertThat(motor("a:free", "llave").interpretar(respuesta(sinTexto, "stop"))).isEmpty();
    }

    @Test
    void unaTarjetaInvalidaDescartaLaRespuesta() throws Exception {
        var tarjetaMala = SALIDA_VALIDA.replace("\"Crítico\"", "\"Grave\"");

        assertThat(motor("a:free", "llave").interpretar(respuesta(tarjetaMala, "stop"))).isEmpty();
    }

    @Test
    void mandaPrimeroLasInstruccionesConElVehiculoLuegoElHistorialYAlFinalElMensaje() throws Exception {
        servidor.expect(requestTo(URL))
                .andExpect(content().string(Matchers.stringContainsInOrder(
                        "\"role\":\"system\"", "Datos del veh", "PRADO",
                        "\"role\":\"user\"", "chilla al frenar",
                        "\"role\":\"assistant\"", "pastillas",
                        "\"role\":\"user\"", "y si sigue sonando")))
                .andRespond(withSuccess(respuesta(SOLO_TEXTO, "stop"), MediaType.APPLICATION_JSON));
        var historial = List.of(new Turno(RolMensaje.PERSONA, "chilla al frenar"),
                new Turno(RolMensaje.MECANICO, "Podrían ser las pastillas."));

        motor("a:free", "llave").conversar("{\"linea\":\"PRADO\"}", historial, "¿y si sigue sonando después?");

        servidor.verify();
    }
}
