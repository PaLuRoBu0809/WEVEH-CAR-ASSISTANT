package co.weveh.mecanicoia.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;

/**
 * Request del frontend para pedir un diagnostico. Solo el sintoma es
 * obligatorio a nivel de forma (Bean Validation); si el vehiculo viene
 * incompleto o ausente, esa es una decision de negocio que resuelve
 * ValidadorSeguridadDiagnostico, no esta capa.
 */
public class SolicitudDiagnosticoDto {

    @NotBlank(message = "El sintoma no puede estar vacio")
    private String sintoma;

    @Valid
    private VehiculoDto vehiculo;

    public SolicitudDiagnosticoDto() {
    }

    public String getSintoma() {
        return sintoma;
    }

    public void setSintoma(String sintoma) {
        this.sintoma = sintoma;
    }

    public VehiculoDto getVehiculo() {
        return vehiculo;
    }

    public void setVehiculo(VehiculoDto vehiculo) {
        this.vehiculo = vehiculo;
    }
}
