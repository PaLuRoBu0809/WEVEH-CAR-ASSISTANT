package co.weveh.catalogo.application;

import co.weveh.catalogo.domain.LineaCatalogo;
import co.weveh.catalogo.domain.MarcaCatalogo;
import co.weveh.shared.domain.TipoVehiculo;
import java.util.List;

/**
 * RF-CAT-01 y RF-CAT-02: búsqueda sin tildes ni mayúsculas; cada palabra de la consulta debe aparecer.
 */
public interface BuscarEnCatalogo {

    int MAXIMO_RESULTADOS = 50;

    List<MarcaCatalogo> marcas(TipoVehiculo tipo, String consulta);

    List<LineaCatalogo> lineas(long marcaId, TipoVehiculo tipo, String consulta);
}
