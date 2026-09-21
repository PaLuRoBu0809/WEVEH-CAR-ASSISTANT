package co.weveh.mecanicoia.service;

import co.weveh.mecanicoia.dto.DiagnosticoResponseDto;
import co.weveh.mecanicoia.dto.SolicitudDiagnosticoDto;
import co.weveh.mecanicoia.dto.VehiculoDto;
import co.weveh.mecanicoia.enums.NivelGravedad;
import co.weveh.mecanicoia.exception.LlmIndisponibleException;
import co.weveh.mecanicoia.exception.RespuestaLlmInvalidaException;
import co.weveh.mecanicoia.service.cliente.ClienteLlm;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.when;

/**
 * Prueba AgenteMecanicoService con ClienteLlm mockeado (sin red real): exito,
 * fallo de red, JSON malformado y nivel_gravedad fuera de esquema.
 */
class AgenteMecanicoServiceTest {

    private ClienteLlm clienteLlm;
    private AgenteMecanicoService agenteMecanicoService;

    private final SolicitudDiagnosticoDto solicitud = solicitudDeEjemplo();

    @BeforeEach
    void setUp() {
        clienteLlm = Mockito.mock(ClienteLlm.class);
        ValidadorSeguridadDiagnostico validador = new ValidadorSeguridadDiagnostico();
        agenteMecanicoService = new AgenteMecanicoService(clienteLlm, validador, new ObjectMapper());
    }

    @Test
    void generarDiagnostico_respuestaValida_mapeaCorrectamenteElDto() {
        String respuestaLlm = """
                {
                  "posible_falla": "Pastillas de freno desgastadas",
                  "nivel_gravedad": "Moderado",
                  "explicacion_simple": "Las pastillas estan desgastadas.",
                  "accion_inmediata": "Agenda revision pronto.",
                  "costo_estimado": "$150.000 - $300.000 COP"
                }
                """;
        when(clienteLlm.obtenerDiagnosticoCrudo(anyString(), anyString())).thenReturn(respuestaLlm);

        DiagnosticoResponseDto resultado = agenteMecanicoService.generarDiagnostico(solicitud);

        assertThat(resultado.getPosibleFalla()).isEqualTo("Pastillas de freno desgastadas");
        // El sintoma de ejemplo menciona "frenos", asi que el validador fuerza Critico.
        assertThat(resultado.getNivelGravedad()).isEqualTo(NivelGravedad.CRITICO);
        assertThat(resultado.isRequiresHumanReview()).isTrue();
    }

    @Test
    void generarDiagnostico_respuestaEnvueltaEnFencesMarkdown_seLimpiaAntesDeParsear() {
        String respuestaLlm = """
                ```json
                {
                  "posible_falla": "Pastillas de freno desgastadas",
                  "nivel_gravedad": "Critico",
                  "explicacion_simple": "Explicacion.",
                  "accion_inmediata": "Accion.",
                  "costo_estimado": null
                }
                ```
                """;
        when(clienteLlm.obtenerDiagnosticoCrudo(anyString(), anyString())).thenReturn(respuestaLlm);

        DiagnosticoResponseDto resultado = agenteMecanicoService.generarDiagnostico(solicitud);

        assertThat(resultado.getPosibleFalla()).isEqualTo("Pastillas de freno desgastadas");
    }

    @Test
    void generarDiagnostico_jsonMalformado_lanzaRespuestaLlmInvalida() {
        when(clienteLlm.obtenerDiagnosticoCrudo(anyString(), anyString())).thenReturn("esto no es json");

        assertThatThrownBy(() -> agenteMecanicoService.generarDiagnostico(solicitud))
                .isInstanceOf(RespuestaLlmInvalidaException.class);
    }

    @Test
    void generarDiagnostico_nivelGravedadFueraDeEsquema_lanzaRespuestaLlmInvalida() {
        String respuestaLlm = """
                {
                  "posible_falla": "Falla",
                  "nivel_gravedad": "Grave",
                  "explicacion_simple": "Explicacion.",
                  "accion_inmediata": "Accion.",
                  "costo_estimado": null
                }
                """;
        when(clienteLlm.obtenerDiagnosticoCrudo(anyString(), anyString())).thenReturn(respuestaLlm);

        assertThatThrownBy(() -> agenteMecanicoService.generarDiagnostico(solicitud))
                .isInstanceOf(RespuestaLlmInvalidaException.class);
    }

    @Test
    void generarDiagnostico_elClienteLlmFalla_propagaLlmIndisponible() {
        when(clienteLlm.obtenerDiagnosticoCrudo(anyString(), anyString()))
                .thenThrow(new LlmIndisponibleException("timeout"));

        assertThatThrownBy(() -> agenteMecanicoService.generarDiagnostico(solicitud))
                .isInstanceOf(LlmIndisponibleException.class);
    }

    private SolicitudDiagnosticoDto solicitudDeEjemplo() {
        SolicitudDiagnosticoDto solicitud = new SolicitudDiagnosticoDto();
        solicitud.setSintoma("Al frenar suena un chillido fuerte y el pedal vibra un poco.");
        VehiculoDto vehiculo = new VehiculoDto();
        vehiculo.setMarca("Mazda");
        vehiculo.setModelo("3");
        vehiculo.setAnio(2018);
        solicitud.setVehiculo(vehiculo);
        return solicitud;
    }
}
