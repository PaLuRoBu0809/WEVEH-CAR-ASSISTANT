package co.weveh.mecanicoia.enums;

import com.fasterxml.jackson.annotation.JsonValue;
import co.weveh.mecanicoia.exception.RespuestaLlmInvalidaException;

import java.text.Normalizer;
import java.util.Arrays;

/**
 * Los tres unicos niveles de gravedad permitidos en el contrato de diagnostico.
 * Centraliza el texto exacto que se serializa al frontend para que ningun otro
 * lugar del codigo use "Critico"/"Moderado"/"Leve" como string suelto.
 */
public enum NivelGravedad {

    CRITICO("Crítico"),
    MODERADO("Moderado"),
    LEVE("Leve");

    private final String etiqueta;

    NivelGravedad(String etiqueta) {
        this.etiqueta = etiqueta;
    }

    @JsonValue
    public String getEtiqueta() {
        return etiqueta;
    }

    public static NivelGravedad desdeTexto(String texto) {
        if (texto == null) {
            throw new RespuestaLlmInvalidaException("El LLM no devolvio un nivel_gravedad");
        }
        String normalizado = normalizarParaComparar(texto);
        return Arrays.stream(values())
                .filter(nivel -> normalizarParaComparar(nivel.etiqueta).equals(normalizado))
                .findFirst()
                .orElseThrow(() -> new RespuestaLlmInvalidaException(
                        "nivel_gravedad fuera de esquema: '" + texto + "'"));
    }

    private static String normalizarParaComparar(String texto) {
        String sinTildes = Normalizer.normalize(texto.trim(), Normalizer.Form.NFD)
                .replaceAll("\\p{M}", "");
        return sinTildes.toLowerCase();
    }
}
