package co.weveh.mecanicoia.dto.llm;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;

/**
 * Espejo permisivo del JSON que devuelve el LLM: todos los campos como String
 * sin validar todavia (nivel_gravedad se valida despues contra el Enum). El
 * @JsonIgnoreProperties(ignoreUnknown = true) es la primera defensa contra
 * prompt injection que intenta agregar campos fuera de esquema (ej.
 * "cupon_descuento"): Jackson los descarta antes de que lleguen a Java.
 */
@JsonIgnoreProperties(ignoreUnknown = true)
public class LlmDiagnosticoBrutoDto {

    @JsonProperty("posible_falla")
    private String posibleFalla;

    @JsonProperty("nivel_gravedad")
    private String nivelGravedad;

    @JsonProperty("explicacion_simple")
    private String explicacionSimple;

    @JsonProperty("accion_inmediata")
    private String accionInmediata;

    @JsonProperty("costo_estimado")
    private String costoEstimado;

    public LlmDiagnosticoBrutoDto() {
    }

    public String getPosibleFalla() {
        return posibleFalla;
    }

    public void setPosibleFalla(String posibleFalla) {
        this.posibleFalla = posibleFalla;
    }

    public String getNivelGravedad() {
        return nivelGravedad;
    }

    public void setNivelGravedad(String nivelGravedad) {
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
}
