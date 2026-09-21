package co.weveh.mecanicoia.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import co.weveh.mecanicoia.enums.NivelGravedad;

/**
 * Respuesta final que ve el frontend, ya pasada por ValidadorSeguridadDiagnostico.
 * requiresHumanReview/requiresMechanic son campos de gobernanza que no estan en el
 * esquema original del prompt (README.md): los agrega el backend de forma
 * deterministica, nunca el LLM.
 */
public class DiagnosticoResponseDto {

    @JsonProperty("posible_falla")
    private String posibleFalla;

    @JsonProperty("nivel_gravedad")
    private NivelGravedad nivelGravedad;

    @JsonProperty("explicacion_simple")
    private String explicacionSimple;

    @JsonProperty("accion_inmediata")
    private String accionInmediata;

    @JsonProperty("costo_estimado")
    private String costoEstimado;

    @JsonProperty("requires_human_review")
    private boolean requiresHumanReview;

    @JsonProperty("requires_mechanic")
    private boolean requiresMechanic;

    public DiagnosticoResponseDto() {
    }

    public String getPosibleFalla() {
        return posibleFalla;
    }

    public void setPosibleFalla(String posibleFalla) {
        this.posibleFalla = posibleFalla;
    }

    public NivelGravedad getNivelGravedad() {
        return nivelGravedad;
    }

    public void setNivelGravedad(NivelGravedad nivelGravedad) {
        this.nivelGravedad = nivelGravedad;
    }

    public String getExplicacionSimple() {
        return explicacionSimple;
    }

    public void setExplicacionSimple(String explicacionSimple) {
        this.explicacionSimple = explicacionSimple;
    }

    public String getAccionInmediata() {
        return accionInmediata;
    }

    public void setAccionInmediata(String accionInmediata) {
        this.accionInmediata = accionInmediata;
    }

    public String getCostoEstimado() {
        return costoEstimado;
    }

    public void setCostoEstimado(String costoEstimado) {
        this.costoEstimado = costoEstimado;
    }

    public boolean isRequiresHumanReview() {
        return requiresHumanReview;
    }

    public void setRequiresHumanReview(boolean requiresHumanReview) {
        this.requiresHumanReview = requiresHumanReview;
    }

    public boolean isRequiresMechanic() {
        return requiresMechanic;
    }

    public void setRequiresMechanic(boolean requiresMechanic) {
        this.requiresMechanic = requiresMechanic;
    }
}
