package co.weveh.garaje.domain;

import co.weveh.shared.domain.DatoInvalidoException;
import java.util.Arrays;

/**
 * Tracción con el mismo código que usa el catálogo del Ministerio ("4X2", "4X4", "AWD").
 */
public enum Traccion {
    TRACCION_4X2("4X2"),
    TRACCION_4X4("4X4"),
    AWD("AWD");

    private final String codigo;

    Traccion(String codigo) {
        this.codigo = codigo;
    }

    public String codigo() {
        return codigo;
    }

    public static Traccion desdeCodigo(String codigo) {
        if (codigo == null) {
            return null;
        }
        return Arrays.stream(values())
                .filter(traccion -> traccion.codigo.equalsIgnoreCase(codigo))
                .findFirst()
                .orElseThrow(() -> new DatoInvalidoException("La tracción debe ser 4X2, 4X4 o AWD"));
    }
}
