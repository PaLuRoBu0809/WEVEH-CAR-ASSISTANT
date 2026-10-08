package co.weveh.shared.domain;

import java.text.Normalizer;
import java.util.Arrays;
import java.util.List;
import java.util.Locale;

/**
 * Texto que escribe la persona para buscar: sin tildes, en minúsculas y partido en palabras.
 */
public record TextoBusqueda(List<String> palabras) {

    private static final int MAXIMO_PALABRAS = 6;

    public TextoBusqueda {
        palabras = List.copyOf(palabras);
    }

    public static TextoBusqueda de(String texto) {
        if (texto == null || texto.isBlank()) {
            return new TextoBusqueda(List.of());
        }
        var palabras = Arrays.stream(normalizar(texto).split("\\s+"))
                .filter(palabra -> !palabra.isBlank())
                .limit(MAXIMO_PALABRAS)
                .toList();
        return new TextoBusqueda(palabras);
    }

    public static String normalizar(String texto) {
        var sinTildes = Normalizer.normalize(texto, Normalizer.Form.NFKD).replaceAll("\\p{M}", "");
        return sinTildes.toLowerCase(Locale.ROOT).strip();
    }

    public boolean estaVacio() {
        return palabras.isEmpty();
    }
}
