package co.weveh.catalogo.infrastructure.persistencia;

import co.weveh.catalogo.application.puertos.CatalogoRepositorio;
import co.weveh.catalogo.domain.LineaCatalogo;
import co.weveh.catalogo.domain.MarcaCatalogo;
import co.weveh.shared.domain.TextoBusqueda;
import co.weveh.shared.domain.TipoVehiculo;
import java.util.List;
import org.springframework.stereotype.Repository;

/**
 * Adaptador de solo lectura sobre el esquema catalogo con Spring Data JDBC (ADR 0006).
 */
@Repository
class CatalogoRepositorioSpringData implements CatalogoRepositorio {

    private final CatalogoFilaRepositorio filas;

    CatalogoRepositorioSpringData(CatalogoFilaRepositorio filas) {
        this.filas = filas;
    }

    @Override
    public List<MarcaCatalogo> buscarMarcas(TipoVehiculo tipo, TextoBusqueda consulta, int limite) {
        return filas.buscarMarcas(nombre(tipo), consulta.palabras(), limite).stream()
                .map(m -> new MarcaCatalogo(m.id(), m.nombre(), m.tipo()))
                .toList();
    }

    @Override
    public List<LineaCatalogo> buscarLineas(long marcaId, TipoVehiculo tipo, TextoBusqueda consulta, int limite) {
        return filas.buscarLineas(marcaId, nombre(tipo), consulta.palabras(), limite).stream()
                .map(l -> new LineaCatalogo(l.id(), l.marcaId(), l.nombre(), l.clase(),
                        TipoVehiculo.valueOf(l.tipoVehiculo()), l.cilindradaCc(), l.potenciaKw(), l.combustible(),
                        l.transmision(), l.traccion(), l.puertas()))
                .toList();
    }

    private static String nombre(TipoVehiculo tipo) {
        return tipo == null ? null : tipo.name();
    }
}
