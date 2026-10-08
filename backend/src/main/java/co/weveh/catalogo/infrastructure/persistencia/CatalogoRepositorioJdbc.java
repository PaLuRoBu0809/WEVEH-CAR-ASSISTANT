package co.weveh.catalogo.infrastructure.persistencia;

import co.weveh.catalogo.application.puertos.CatalogoRepositorio;
import co.weveh.catalogo.domain.LineaCatalogo;
import co.weveh.catalogo.domain.MarcaCatalogo;
import co.weveh.shared.domain.TextoBusqueda;
import co.weveh.shared.domain.TipoVehiculo;
import java.util.ArrayList;
import java.util.List;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Repository;

/**
 * Solo lectura sobre el esquema catalogo. Cada palabra de la consulta se busca con LIKE sobre nombre_normalizado
 * (índice trigram); los comodines que escriba la persona se escapan.
 */
@Repository
class CatalogoRepositorioJdbc implements CatalogoRepositorio {

    private final JdbcClient jdbc;

    CatalogoRepositorioJdbc(JdbcClient jdbc) {
        this.jdbc = jdbc;
    }

    @Override
    public List<MarcaCatalogo> buscarMarcas(TipoVehiculo tipo, TextoBusqueda consulta, int limite) {
        var sql = new StringBuilder("select id, nombre, tipo from catalogo.marca where true");
        var parametros = new ArrayList<Object>();
        if (tipo != null) {
            sql.append(" and tipo in (?, 'AMBOS')");
            parametros.add(tipo.name());
        }
        agregarPalabras(sql, parametros, consulta);
        sql.append(" order by nombre limit ?");
        parametros.add(limite);
        return jdbc.sql(sql.toString()).params(parametros)
                .query((fila, n) -> new MarcaCatalogo(fila.getLong("id"), fila.getString("nombre"), fila.getString("tipo")))
                .list();
    }

    @Override
    public List<LineaCatalogo> buscarLineas(long marcaId, TipoVehiculo tipo, TextoBusqueda consulta, int limite) {
        var sql = new StringBuilder("""
                select id, marca_id, nombre, clase, tipo_vehiculo, cilindrada_cc, potencia_kw,
                       combustible, transmision, traccion, puertas
                from catalogo.linea
                where marca_id = ? and not es_generica""");
        var parametros = new ArrayList<Object>(List.of(marcaId));
        if (tipo != null) {
            sql.append(" and tipo_vehiculo = ?");
            parametros.add(tipo.name());
        }
        agregarPalabras(sql, parametros, consulta);
        sql.append(" order by nombre, cilindrada_cc nulls last limit ?");
        parametros.add(limite);
        return jdbc.sql(sql.toString()).params(parametros)
                .query((fila, n) -> new LineaCatalogo(
                        fila.getLong("id"),
                        fila.getLong("marca_id"),
                        fila.getString("nombre"),
                        fila.getString("clase"),
                        TipoVehiculo.valueOf(fila.getString("tipo_vehiculo")),
                        fila.getObject("cilindrada_cc", Integer.class),
                        fila.getBigDecimal("potencia_kw"),
                        fila.getString("combustible"),
                        fila.getString("transmision"),
                        fila.getString("traccion"),
                        fila.getObject("puertas", Integer.class)))
                .list();
    }

    private static void agregarPalabras(StringBuilder sql, List<Object> parametros, TextoBusqueda consulta) {
        for (var palabra : consulta.palabras()) {
            sql.append(" and nombre_normalizado like ? escape '!'");
            parametros.add("%" + escaparComodines(palabra) + "%");
        }
    }

    static String escaparComodines(String palabra) {
        return palabra.replace("!", "!!").replace("%", "!%").replace("_", "!_");
    }
}
