package co.weveh.mecanicoia.service;

import co.weveh.mecanicoia.dto.DiagnosticoResponseDto;
import co.weveh.mecanicoia.dto.SolicitudDiagnosticoDto;
import co.weveh.mecanicoia.dto.VehiculoDto;
import co.weveh.mecanicoia.enums.NivelGravedad;
import org.springframework.stereotype.Service;

import java.text.Normalizer;
import java.util.List;
import java.util.regex.Pattern;

/**
 * Capa de validacion determinista descrita en docs/arquitectura.md como
 * "ValidadorSeguridad": revisa el diagnostico que propuso el LLM y puede
 * sobrescribirlo sin depender de que el modelo haya cooperado. Equivalente en
 * codigo de validate_diagnostico_mecanico(output, input_text) pedido en
 * MAKERS_REVIEW.md. No llama al LLM ni tiene dependencias externas: es
 * deliberadamente testeable en aislamiento contra evals/eval_cases.json.
 */
@Service
public class ValidadorSeguridadDiagnostico {

    private static final List<String> PALABRAS_CRITICAS = List.of(
            "testigo rojo", "luz roja", "bombillito rojo", "lamparita",
            "aceite", "temperatura", "recalent", "humo",
            "fren", "direccion", "bateria"
    );

    private static final Pattern COSTO_NO_CONFIABLE = Pattern.compile(
            "^\\s*\\$?\\s*0([.,]0+)?\\s*(cop)?\\s*$|gratis|regalo|cup[oó]n|promoci[oó]n",
            Pattern.CASE_INSENSITIVE);

    public DiagnosticoResponseDto aplicarReglasDeSeguridad(
            DiagnosticoResponseDto diagnostico, SolicitudDiagnosticoDto solicitud) {

        if (contieneRedFlag(solicitud.getSintoma())) {
            return forzarCritico(diagnostico);
        }

        if (perfilVehiculoIncompleto(solicitud.getVehiculo())) {
            return forzarSolicitudDeDatos(diagnostico);
        }

        return diagnostico;
    }

    private boolean contieneRedFlag(String sintoma) {
        if (sintoma == null) {
            return false;
        }
        String textoNormalizado = normalizar(sintoma);
        return PALABRAS_CRITICAS.stream().anyMatch(textoNormalizado::contains);
    }

    private DiagnosticoResponseDto forzarCritico(DiagnosticoResponseDto diagnostico) {
        diagnostico.setNivelGravedad(NivelGravedad.CRITICO);
        diagnostico.setRequiresHumanReview(true);
        diagnostico.setRequiresMechanic(true);
        diagnostico.setCostoEstimado(sanearCosto(diagnostico.getCostoEstimado()));
        return diagnostico;
    }

    private boolean perfilVehiculoIncompleto(VehiculoDto vehiculo) {
        if (vehiculo == null) {
            return true;
        }
        return vehiculo.getMarca() == null
                || vehiculo.getModelo() == null
                || vehiculo.getAnio() == null;
    }

    private DiagnosticoResponseDto forzarSolicitudDeDatos(DiagnosticoResponseDto diagnostico) {
        diagnostico.setCostoEstimado(null);
        diagnostico.setRequiresHumanReview(false);
        diagnostico.setRequiresMechanic(false);
        return diagnostico;
    }

    private String sanearCosto(String costoEstimado) {
        if (costoEstimado == null) {
            return null;
        }
        if (COSTO_NO_CONFIABLE.matcher(costoEstimado.trim()).find()) {
            return null;
        }
        return costoEstimado;
    }

    private String normalizar(String texto) {
        String sinTildes = Normalizer.normalize(texto.trim(), Normalizer.Form.NFD)
                .replaceAll("\\p{M}", "");
        return sinTildes.toLowerCase();
    }
}
