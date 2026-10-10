package co.weveh.mecanicoia.domain;

import java.util.Arrays;
import java.util.Optional;

/**
 * Contrato del README (diagnostico_mecanico_preventivo): "Crítico" | "Moderado" | "Leve".
 */
public enum NivelGravedad {
    LEVE("Leve"),
    MODERADO("Moderado"),
    CRITICO("Crítico");

    private final String texto;

    NivelGravedad(String texto) {
        this.texto = texto;
    }

    public String texto() {
        return texto;
    }

    public static Optional<NivelGravedad> desdeTexto(String texto) {
        return Arrays.stream(values()).filter(nivel -> nivel.texto.equals(texto)).findFirst();
    }

    public NivelGravedad alMenos(NivelGravedad minimo) {
        return ordinal() >= minimo.ordinal() ? this : minimo;
    }
}
