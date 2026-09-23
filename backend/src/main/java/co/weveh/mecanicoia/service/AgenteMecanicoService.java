package co.weveh.mecanicoia.service;

import co.weveh.mecanicoia.dto.DiagnosticoResponseDto;
import co.weveh.mecanicoia.dto.SolicitudDiagnosticoDto;
import co.weveh.mecanicoia.dto.VehiculoDto;
import co.weveh.mecanicoia.dto.llm.LlmDiagnosticoBrutoDto;
import co.weveh.mecanicoia.enums.NivelGravedad;
import co.weveh.mecanicoia.exception.RespuestaLlmInvalidaException;
import co.weveh.mecanicoia.service.cliente.ClienteLlm;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.io.UncheckedIOException;
import java.nio.charset.StandardCharsets;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.regex.Pattern;

/**
 * Orquesta el diagnostico: arma el prompt, llama al LLM via ClienteLlm, parsea
 * su respuesta y delega la decision de seguridad a ValidadorSeguridadDiagnostico.
 * No contiene la regla de red flags: eso vive en ValidadorSeguridadDiagnostico
 * para mantener responsabilidad unica.
 */
@Service
public class AgenteMecanicoService {

    private static final Pattern FENCES_MARKDOWN =
            Pattern.compile("^```(json)?\\s*|\\s*```$", Pattern.MULTILINE);

    private final ClienteLlm clienteLlm;
    private final ValidadorSeguridadDiagnostico validadorSeguridad;
    private final ObjectMapper objectMapper;
    private final String promptSistema;

    public AgenteMecanicoService(ClienteLlm clienteLlm,
                                  ValidadorSeguridadDiagnostico validadorSeguridad,
                                  ObjectMapper objectMapper) {
        this.clienteLlm = clienteLlm;
        this.validadorSeguridad = validadorSeguridad;
        this.objectMapper = objectMapper;
        this.promptSistema = cargarPromptSistema();
    }

    public DiagnosticoResponseDto generarDiagnostico(SolicitudDiagnosticoDto solicitud) {
        String payloadUsuario = construirPayloadUsuario(solicitud);
        String respuestaCruda = clienteLlm.obtenerDiagnosticoCrudo(promptSistema, payloadUsuario);

        String jsonLimpio = limpiarFencesMarkdown(respuestaCruda);
        LlmDiagnosticoBrutoDto diagnosticoBruto = parsearJson(jsonLimpio);
        DiagnosticoResponseDto diagnosticoPreliminar = mapearADto(diagnosticoBruto);

        return validadorSeguridad.aplicarReglasDeSeguridad(diagnosticoPreliminar, solicitud);
    }

    private String construirPayloadUsuario(SolicitudDiagnosticoDto solicitud) {
        Map<String, Object> payload = new LinkedHashMap<>();
        payload.put("input", solicitud.getSintoma());
        payload.put("vehiculo", describirVehiculo(solicitud.getVehiculo()));
        try {
            return objectMapper.writeValueAsString(payload);
        } catch (JsonProcessingException excepcion) {
            throw new RespuestaLlmInvalidaException("No se pudo serializar la solicitud del usuario", excepcion);
        }
    }

    private Map<String, Object> describirVehiculo(VehiculoDto vehiculo) {
        Map<String, Object> descripcion = new LinkedHashMap<>();
        if (vehiculo == null) {
            return descripcion;
        }
        descripcion.put("marca", vehiculo.getMarca());
        descripcion.put("modelo", vehiculo.getModelo());
        descripcion.put("anio", vehiculo.getAnio());
        descripcion.put("kilometraje", vehiculo.getKilometraje());
        descripcion.put("historial_mantenimiento", vehiculo.getHistorialMantenimiento());
        return descripcion;
    }

    private String limpiarFencesMarkdown(String texto) {
        return FENCES_MARKDOWN.matcher(texto.trim()).replaceAll("").trim();
    }

    private LlmDiagnosticoBrutoDto parsearJson(String json) {
        try {
            return objectMapper.readValue(json, LlmDiagnosticoBrutoDto.class);
        } catch (JsonProcessingException excepcion) {
            throw new RespuestaLlmInvalidaException("El LLM devolvio un JSON malformado", excepcion);
        }
    }

    private DiagnosticoResponseDto mapearADto(LlmDiagnosticoBrutoDto bruto) {
        DiagnosticoResponseDto diagnostico = new DiagnosticoResponseDto();
        diagnostico.setPosibleFalla(bruto.getPosibleFalla());
        diagnostico.setNivelGravedad(NivelGravedad.desdeTexto(bruto.getNivelGravedad()));
        diagnostico.setExplicacionSimple(bruto.getExplicacionSimple());
        diagnostico.setAccionInmediata(bruto.getAccionInmediata());
        diagnostico.setCostoEstimado(bruto.getCostoEstimado());
        diagnostico.setRequiresHumanReview(false);
        diagnostico.setRequiresMechanic(false);
        return diagnostico;
    }

    private String cargarPromptSistema() {
        try {
            byte[] bytes = new ClassPathResource("prompts/system-prototype-diagnostico.txt").getContentAsByteArray();
            return new String(bytes, StandardCharsets.UTF_8);
        } catch (IOException excepcion) {
            throw new UncheckedIOException("No se pudo cargar el prompt de sistema del Mecanico IA", excepcion);
        }
    }
}
