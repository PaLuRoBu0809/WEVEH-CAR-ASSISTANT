package co.weveh.catalogo.infrastructure.persistencia;

import java.util.List;
import org.springframework.jdbc.core.DataClassRowMapper;
import org.springframework.jdbc.core.namedparam.MapSqlParameterSource;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;

/**
 * Cada palabra se busca con LIKE sobre nombre_normalizado (índice trigram). Los comodines que escriba la persona se
 * escapan y todo valor va como parámetro, nunca pegado al SQL.
 */
class BusquedaCatalogoImpl implements BusquedaCatalogo {

    private final NamedParameterJdbcTemplate jdbc;

    BusquedaCatalogoImpl(NamedParameterJdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    @Override
    public List<MarcaFila> buscarMarcas(String tipo, List<String> palabras, int limite) {
        var sql = new StringBuilder("select id, nombre, tipo from catalogo.marca where true");
        var parametros = new MapSqlParameterSource("limite", limite);
        if (tipo != null) {
            sql.append(" and tipo in (:tipo, 'AMBOS')");
            parametros.addValue("tipo", tipo);
        }
        agregarPalabras(sql, parametros, palabras);
        sql.append(" order by nombre limit :limite");
        return jdbc.query(sql.toString(), parametros, new DataClassRowMapper<>(MarcaFila.class));
    }

    @Override
    public List<LineaFila> buscarLineas(long marcaId, String tipo, List<String> palabras, int limite) {
        var sql = new StringBuilder("""
                select id, marca_id, nombre, clase, tipo_vehiculo, cilindrada_cc, potencia_kw,
                       combustible, transmision, traccion, puertas
                from catalogo.linea
                where marca_id = :marcaId and not es_generica""");
        var parametros = new MapSqlParameterSource("marcaId", marcaId).addValue("limite", limite);
        if (tipo != null) {
            sql.append(" and tipo_vehiculo = :tipo");
            parametros.addValue("tipo", tipo);
        }
        agregarPalabras(sql, parametros, palabras);
        sql.append(" order by nombre, cilindrada_cc nulls last limit :limite");
        return jdbc.query(sql.toString(), parametros, new DataClassRowMapper<>(LineaFila.class));
    }

    private static void agregarPalabras(StringBuilder sql, MapSqlParameterSource parametros, List<String> palabras) {
        for (var i = 0; i < palabras.size(); i++) {
            sql.append(" and nombre_normalizado like :palabra").append(i).append(" escape '!'");
            parametros.addValue("palabra" + i, "%" + escaparComodines(palabras.get(i)) + "%");
        }
    }

    static String escaparComodines(String palabra) {
        return palabra.replace("!", "!!").replace("%", "!%").replace("_", "!_");
    }
}
