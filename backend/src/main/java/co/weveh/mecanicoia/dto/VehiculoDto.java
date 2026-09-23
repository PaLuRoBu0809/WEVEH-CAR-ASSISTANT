package co.weveh.mecanicoia.dto;

/**
 * Perfil del vehiculo. Todos los campos son nullable porque el perfil del usuario
 * puede venir incompleto (caso "input_incompleto" de evals/eval_cases.json): el
 * sistema debe pedir el dato faltante, no inventarlo.
 */
public class VehiculoDto {

    private String marca;
    private String modelo;
    private Integer anio;
    private Integer kilometraje;
    private String historialMantenimiento;

    public VehiculoDto() {
    }

    public String getMarca() {
        return marca;
    }

    public void setMarca(String marca) {
        this.marca = marca;
    }

    public String getModelo() {
        return modelo;
    }

    public void setModelo(String modelo) {
        this.modelo = modelo;
    }

    public Integer getAnio() {
        return anio;
    }

    public void setAnio(Integer anio) {
        this.anio = anio;
    }

    public Integer getKilometraje() {
        return kilometraje;
    }

    public void setKilometraje(Integer kilometraje) {
        this.kilometraje = kilometraje;
    }

    public String getHistorialMantenimiento() {
        return historialMantenimiento;
    }

    public void setHistorialMantenimiento(String historialMantenimiento) {
        this.historialMantenimiento = historialMantenimiento;
    }
}
