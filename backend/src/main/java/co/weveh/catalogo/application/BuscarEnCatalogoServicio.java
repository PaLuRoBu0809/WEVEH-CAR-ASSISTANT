package co.weveh.catalogo.application;

import co.weveh.catalogo.application.puertos.CatalogoRepositorio;
import co.weveh.catalogo.domain.LineaCatalogo;
import co.weveh.catalogo.domain.MarcaCatalogo;
import co.weveh.shared.domain.TextoBusqueda;
import co.weveh.shared.domain.TipoVehiculo;
import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional(readOnly = true)
class BuscarEnCatalogoServicio implements BuscarEnCatalogo {

    private final CatalogoRepositorio repositorio;

    BuscarEnCatalogoServicio(CatalogoRepositorio repositorio) {
        this.repositorio = repositorio;
    }

    @Override
    public List<MarcaCatalogo> marcas(TipoVehiculo tipo, String consulta) {
        return repositorio.buscarMarcas(tipo, TextoBusqueda.de(consulta), MAXIMO_RESULTADOS);
    }

    @Override
    public List<LineaCatalogo> lineas(long marcaId, TipoVehiculo tipo, String consulta) {
        return repositorio.buscarLineas(marcaId, tipo, TextoBusqueda.de(consulta), MAXIMO_RESULTADOS);
    }
}
