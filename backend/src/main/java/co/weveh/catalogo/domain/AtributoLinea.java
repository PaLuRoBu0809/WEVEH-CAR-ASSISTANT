package co.weveh.catalogo.domain;

import java.util.Arrays;
import java.util.List;

/**
 * Un atributo de la línea (combustible, transmisión o tracción) con de dónde sale (RF-CAT-04, ADR 0021). Varios valores
 * significan que el modelo se vende en varias versiones: la app pregunta solo entre ellos.
 *
 * @param fuente URL que respalda el dato; null cuando sale del nombre de la línea
 */
public record AtributoLinea(List<String> valores, OrigenAtributo origen, String fuente) {

    public AtributoLinea {
        valores = List.copyOf(valores);
    }

    /**
     * Gana lo que dice el nombre de la línea; si no dice nada, lo investigado y revisado; si tampoco hay, null (la app
     * pregunta).
     *
     * @param delNombre      valor de la columna de catalogo.linea, deducido del nombre (capa 0)
     * @param investigados   valores separados por coma de catalogo.atributo_linea, ya filtrados a los revisados
     * @param origenInvestigado IA_WEB o EQUIPO
     */
    public static AtributoLinea resolver(String delNombre, String investigados, String origenInvestigado,
                                         String fuente) {
        if (delNombre != null) {
            return new AtributoLinea(List.of(delNombre), OrigenAtributo.CATALOGO, null);
        }
        if (investigados == null || investigados.isBlank() || origenInvestigado == null) {
            return null;
        }
        var valores = Arrays.stream(investigados.split(",")).map(String::strip).filter(v -> !v.isEmpty()).toList();
        return valores.isEmpty() ? null : new AtributoLinea(valores, OrigenAtributo.valueOf(origenInvestigado), fuente);
    }
}
