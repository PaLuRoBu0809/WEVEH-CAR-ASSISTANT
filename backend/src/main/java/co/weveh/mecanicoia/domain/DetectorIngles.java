package co.weveh.mecanicoia.domain;

import java.util.Locale;
import java.util.Set;
import java.util.regex.Pattern;

/**
 * Los modelos gratuitos a veces mezclan inglés en la respuesta ("lo que está happening"). La app habla español sin
 * jerga (RF-MIA-01), así que una respuesta con palabras comunes del inglés se trata como inválida y se prueba el
 * siguiente modelo. Solo palabras de uso general: nombres de marcas o líneas ("Land Cruiser", "Spark") no se marcan.
 */
public final class DetectorIngles {

    private static final Set<String> PALABRAS_INGLES = Set.of(
            "the", "is", "are", "was", "were", "be", "been", "with", "without", "and", "or", "but", "of", "to", "for",
            "from", "this", "that", "these", "those", "it", "its", "you", "your", "we", "they", "what", "which",
            "when", "where", "why", "how", "should", "could", "would", "will", "can", "not", "if", "then", "there",
            "happening", "issue", "problem", "check", "please", "car", "engine", "brake", "brakes", "wheel", "noise",
            "maybe", "likely", "possible", "replace", "recommend", "recommended");

    private static final Pattern PALABRA = Pattern.compile("\\p{L}+");

    private DetectorIngles() {
    }

    /** @return true si el texto trae al menos una palabra común del inglés */
    public static boolean tieneIngles(String texto) {
        if (texto == null) {
            return false;
        }
        var palabras = PALABRA.matcher(texto.toLowerCase(Locale.ROOT));
        while (palabras.find()) {
            if (PALABRAS_INGLES.contains(palabras.group())) {
                return true;
            }
        }
        return false;
    }
}
