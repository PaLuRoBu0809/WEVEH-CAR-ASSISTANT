package co.weveh.mecanicoia.infrastructure.persistencia;

import co.weveh.mecanicoia.application.puertos.ConversacionRepositorio;
import co.weveh.mecanicoia.domain.Diagnostico;
import co.weveh.mecanicoia.domain.RolMensaje;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.time.Instant;
import java.time.OffsetDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.stereotype.Repository;
import tools.jackson.databind.json.JsonMapper;

/** Tablas conversacion_mecanico y mensaje_mecanico (V12). La tarjeta va como jsonb, ya validada. */
@Repository
class ConversacionRepositorioJdbc implements ConversacionRepositorio {

    private final NamedParameterJdbcTemplate jdbc;
    private final JsonMapper json;

    ConversacionRepositorioJdbc(NamedParameterJdbcTemplate jdbc, JsonMapper json) {
        this.jdbc = jdbc;
        this.json = json;
    }

    @Override
    public Instant crear(UUID id, UUID vehiculoId) {
        return jdbc.queryForObject("""
                        insert into conversacion_mecanico (id, vehiculo_id) values (:id, :vehiculo) returning creada_en""",
                Map.of("id", id, "vehiculo", vehiculoId), OffsetDateTime.class).toInstant();
    }

    @Override
    public boolean existe(UUID id, UUID vehiculoId) {
        return Boolean.TRUE.equals(jdbc.queryForObject("""
                        select exists (select 1 from conversacion_mecanico where id = :id and vehiculo_id = :vehiculo)""",
                Map.of("id", id, "vehiculo", vehiculoId), Boolean.class));
    }

    @Override
    public List<Resumen> listar(UUID vehiculoId) {
        return jdbc.query("""
                        select c.id, c.actualizada_en,
                               (select m.texto from mensaje_mecanico m
                                 where m.conversacion_id = c.id and m.rol = 'PERSONA' order by m.orden limit 1) as primer_mensaje
                        from conversacion_mecanico c where c.vehiculo_id = :vehiculo
                        order by c.actualizada_en desc""",
                Map.of("vehiculo", vehiculoId),
                (fila, n) -> new Resumen(fila.getObject("id", UUID.class),
                        fila.getObject("actualizada_en", OffsetDateTime.class).toInstant(), fila.getString("primer_mensaje")));
    }

    @Override
    public List<Mensaje> mensajes(UUID conversacionId) {
        return jdbc.query("""
                        select id, rol, texto, tarjeta::text as tarjeta, creado_en from mensaje_mecanico
                        where conversacion_id = :conversacion order by orden""",
                Map.of("conversacion", conversacionId), this::mensaje);
    }

    @Override
    public List<Mensaje> ultimos(UUID conversacionId, int cuantos) {
        return jdbc.query("""
                        select * from (
                          select orden, id, rol, texto, tarjeta::text as tarjeta, creado_en from mensaje_mecanico
                          where conversacion_id = :conversacion order by orden desc limit :cuantos
                        ) ultimos order by orden""",
                Map.of("conversacion", conversacionId, "cuantos", cuantos), this::mensaje);
    }

    @Override
    public void guardar(UUID conversacionId, Mensaje mensaje, String modelo, String versionPrompt) {
        var parametros = new HashMap<String, Object>();
        parametros.put("id", mensaje.id());
        parametros.put("conversacion", conversacionId);
        parametros.put("rol", mensaje.rol().name());
        parametros.put("texto", mensaje.texto());
        parametros.put("tarjeta", mensaje.tarjeta() == null ? null : json.writeValueAsString(mensaje.tarjeta()));
        parametros.put("modelo", modelo);
        parametros.put("versionPrompt", versionPrompt);
        jdbc.update("""
                insert into mensaje_mecanico (id, conversacion_id, rol, texto, tarjeta, modelo, version_prompt)
                values (:id, :conversacion, :rol, :texto, cast(:tarjeta as jsonb), :modelo, :versionPrompt)""", parametros);
        jdbc.update("update conversacion_mecanico set actualizada_en = now() where id = :conversacion",
                Map.of("conversacion", conversacionId));
    }

    private Mensaje mensaje(ResultSet fila, int numero) throws SQLException {
        var tarjeta = fila.getString("tarjeta");
        return new Mensaje(fila.getObject("id", UUID.class), RolMensaje.valueOf(fila.getString("rol")),
                fila.getString("texto"), tarjeta == null ? null : json.readValue(tarjeta, Diagnostico.class),
                fila.getObject("creado_en", OffsetDateTime.class).toInstant());
    }
}
