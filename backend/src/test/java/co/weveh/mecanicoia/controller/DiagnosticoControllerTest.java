package co.weveh.mecanicoia.controller;

import co.weveh.mecanicoia.dto.DiagnosticoResponseDto;
import co.weveh.mecanicoia.enums.NivelGravedad;
import co.weveh.mecanicoia.exception.LlmIndisponibleException;
import co.weveh.mecanicoia.exception.RespuestaLlmInvalidaException;
import co.weveh.mecanicoia.service.AgenteMecanicoService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Prueba solo la capa HTTP: valida que el controller traduzca correctamente
 * las excepciones de la capa de servicio (mockeada) a los status code definidos
 * en ManejadorGlobalExcepciones.
 */
@WebMvcTest(DiagnosticoController.class)
class DiagnosticoControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private AgenteMecanicoService agenteMecanicoService;

    @Test
    void generarDiagnostico_solicitudValida_devuelve200ConElDiagnostico() throws Exception {
        DiagnosticoResponseDto diagnostico = new DiagnosticoResponseDto();
        diagnostico.setPosibleFalla("Pastillas de freno desgastadas");
        diagnostico.setNivelGravedad(NivelGravedad.CRITICO);
        diagnostico.setExplicacionSimple("Explicacion simple.");
        diagnostico.setAccionInmediata("No conducir.");
        diagnostico.setCostoEstimado(null);
        diagnostico.setRequiresHumanReview(true);
        diagnostico.setRequiresMechanic(true);
        when(agenteMecanicoService.generarDiagnostico(any())).thenReturn(diagnostico);

        mockMvc.perform(post("/api/diagnosticos")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"sintoma": "Al frenar suena un chillido fuerte."}
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.nivel_gravedad").value("Crítico"))
                .andExpect(jsonPath("$.requires_human_review").value(true));
    }

    @Test
    void generarDiagnostico_sintomaVacio_devuelve400() throws Exception {
        mockMvc.perform(post("/api/diagnosticos")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"sintoma": ""}
                                """))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.codigo").value("SOLICITUD_INVALIDA"));
    }

    @Test
    void generarDiagnostico_elLlmNoResponde_devuelve502() throws Exception {
        when(agenteMecanicoService.generarDiagnostico(any()))
                .thenThrow(new LlmIndisponibleException("timeout"));

        mockMvc.perform(post("/api/diagnosticos")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"sintoma": "Ruido raro al frenar."}
                                """))
                .andExpect(status().isBadGateway())
                .andExpect(jsonPath("$.codigo").value("LLM_INDISPONIBLE"));
    }

    @Test
    void generarDiagnostico_elLlmDevuelveJsonInvalido_devuelve502() throws Exception {
        when(agenteMecanicoService.generarDiagnostico(any()))
                .thenThrow(new RespuestaLlmInvalidaException("json malformado"));

        mockMvc.perform(post("/api/diagnosticos")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"sintoma": "Ruido raro al frenar."}
                                """))
                .andExpect(status().isBadGateway())
                .andExpect(jsonPath("$.codigo").value("RESPUESTA_LLM_INVALIDA"));
    }
}
