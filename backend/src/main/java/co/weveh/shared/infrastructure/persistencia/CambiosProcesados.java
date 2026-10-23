package co.weveh.shared.infrastructure.persistencia;

import java.time.Duration;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.stereotype.Repository;

/**
 * Las respuestas ya enviadas por cada {@code Idempotency-Key} (ADR 0009, tabla {@code cambio_procesado}). Se guardan
 * una semana: la cola de la app reintenta mucho antes.
 */
@Repository
public class CambiosProcesados {

    static final Duration CONSERVACION = Duration.ofDays(7);

    private final NamedParameterJdbcTemplate jdbc;

    CambiosProcesados(NamedParameterJdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    public Optional<CambioProcesado> buscar(UUID usuario, UUID clave) {
        return jdbc.query("""
                        select metodo, ruta, estado_http, tipo_contenido, cuerpo
                        from cambio_procesado where usuario_id = :usuario and clave = :clave""",
                Map.of("usuario", usuario, "clave", clave),
                (fila, n) -> new CambioProcesado(fila.getString("metodo"), fila.getString("ruta"),
                        fila.getInt("estado_http"), fila.getString("tipo_contenido"), fila.getString("cuerpo")))
                .stream().findFirst();
    }

    /** Si dos envíos del mismo cambio llegan a la vez, queda el primero. Borra de paso lo de más de una semana. */
    public void guardar(UUID usuario, UUID clave, CambioProcesado cambio) {
        var parametros = new java.util.HashMap<String, Object>();
        parametros.put("usuario", usuario);
        parametros.put("clave", clave);
        parametros.put("metodo", cambio.metodo());
        parametros.put("ruta", cambio.ruta());
        parametros.put("estado", cambio.estadoHttp());
        parametros.put("tipo", cambio.tipoContenido());
        parametros.put("cuerpo", cambio.cuerpo());
        parametros.put("dias", (int) CONSERVACION.toDays());
        jdbc.update("""
                insert into cambio_procesado (usuario_id, clave, metodo, ruta, estado_http, tipo_contenido, cuerpo)
                values (:usuario, :clave, :metodo, :ruta, :estado, :tipo, :cuerpo)
                on conflict (usuario_id, clave) do nothing""", parametros);
        jdbc.update("""
                delete from cambio_procesado
                where usuario_id = :usuario and procesado_en < now() - make_interval(days => :dias)""", parametros);
    }

    public record CambioProcesado(String metodo, String ruta, int estadoHttp, String tipoContenido, String cuerpo) {

        public boolean esElMismoCambio(String otroMetodo, String otraRuta) {
            return metodo.equals(otroMetodo) && ruta.equals(otraRuta);
        }
    }
}
