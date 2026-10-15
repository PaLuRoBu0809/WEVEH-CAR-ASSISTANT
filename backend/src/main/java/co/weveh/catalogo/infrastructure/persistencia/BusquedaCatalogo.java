package co.weveh.catalogo.infrastructure.persistencia;

import java.util.List;

/**
 * Fragmento personalizado del repositorio del catálogo (ADR 0006): la búsqueda arma el SQL según las palabras que
 * escribe la persona, así que no cabe en un método derivado ni en un @Query fijo.
 */
interface BusquedaCatalogo {

    /** @param tipo CARRO o MOTO; null para no filtrar */
    List<MarcaFila> buscarMarcas(String tipo, List<String> palabras, int limite);

    /** @param tipo CARRO o MOTO; null para no filtrar */
    List<LineaFila> buscarLineas(long marcaId, String tipo, List<String> palabras, int limite);
}
