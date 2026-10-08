package co.weveh.catalogo.application.puertos;

import co.weveh.catalogo.domain.LineaCatalogo;
import co.weveh.catalogo.domain.MarcaCatalogo;
import co.weveh.shared.domain.TextoBusqueda;
import co.weveh.shared.domain.TipoVehiculo;
import java.util.List;

public interface CatalogoRepositorio {

    List<MarcaCatalogo> buscarMarcas(TipoVehiculo tipo, TextoBusqueda consulta, int limite);

    /** Solo líneas reales (no genéricas) de la marca, ordenadas por nombre y cilindrada. */
    List<LineaCatalogo> buscarLineas(long marcaId, TipoVehiculo tipo, TextoBusqueda consulta, int limite);
}
