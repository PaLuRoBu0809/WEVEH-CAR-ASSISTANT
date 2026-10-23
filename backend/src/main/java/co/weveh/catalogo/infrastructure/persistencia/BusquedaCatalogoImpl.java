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
                select l.id, l.marca_id, l.nombre, l.clase, l.tipo_vehiculo, l.cilindrada_cc, l.potencia_kw,
                       l.combustible, l.transmision, l.traccion, l.puertas,
                       c.valores as combustible_investigado, c.origen as combustible_origen, c.fuente_url as combustible_fuente,
                       t.valores as transmision_investigada, t.origen as transmision_origen, t.fuente_url as transmision_fuente,
                       r.valores as traccion_investigada, r.origen as traccion_origen, r.fuente_url as traccion_fuente
                from catalogo.linea l
                """)
                .append(investigado("COMBUSTIBLE", "c"))
                .append(investigado("TRANSMISION", "t"))
                .append(investigado("TRACCION", "r"))
                .append(" where l.marca_id = :marcaId and not l.es_generica");
        var parametros = new MapSqlParameterSource("marcaId", marcaId).addValue("limite", limite);
        if (tipo != null) {
            sql.append(" and l.tipo_vehiculo = :tipo");
            parametros.addValue("tipo", tipo);
        }
        agregarPalabras(sql, parametros, palabras);
        sql.append(" order by l.nombre, l.cilindrada_cc nulls last limit :limite");
        return jdbc.query(sql.toString(), parametros, new DataClassRowMapper<>(LineaFila.class));
    }

    /**
     * Lo investigado y revisado de un atributo (ADR 0021): una corrección del equipo gana sobre la web, y de la web solo
     * cuenta lo verificado. El atributo es una constante del código, nunca texto de la persona.
     */
    private static String investigado(String atributo, String alias) {
        return """
                left join lateral (
                  select array_to_string(a.valores, ',') as valores, a.origen, a.fuente_url
                  from catalogo.atributo_linea a
                  where a.linea_id = l.id and a.atributo = '%s'
                    and (a.origen = 'EQUIPO' or (a.origen = 'IA_WEB' and a.verificada))
                  order by case a.origen when 'EQUIPO' then 0 else 1 end
                  limit 1) %s on true
                """.formatted(atributo, alias);
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
