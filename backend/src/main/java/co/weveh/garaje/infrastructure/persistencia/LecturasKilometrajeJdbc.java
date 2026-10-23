package co.weveh.garaje.infrastructure.persistencia;

import co.weveh.garaje.application.puertos.LecturasKilometraje;
import java.time.LocalDate;
import java.util.Map;
import java.util.OptionalInt;
import java.util.UUID;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.stereotype.Repository;

/** Tabla lectura_kilometraje (V11). */
@Repository
class LecturasKilometrajeJdbc implements LecturasKilometraje {

    private final NamedParameterJdbcTemplate jdbc;

    LecturasKilometrajeJdbc(NamedParameterJdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    @Override
    public void anotar(UUID vehiculoId, int km, LocalDate leidoEn) {
        jdbc.update("insert into lectura_kilometraje (vehiculo_id, km, leido_en) values (:vehiculo, :km, :leidoEn)",
                Map.of("vehiculo", vehiculoId, "km", km, "leidoEn", leidoEn));
    }

    @Override
    public OptionalInt anteriorALaUltima(UUID vehiculoId) {
        return jdbc.queryForList("""
                        select km from lectura_kilometraje where vehiculo_id = :vehiculo
                        order by id desc offset 1 limit 1""", Map.of("vehiculo", vehiculoId), Integer.class)
                .stream().mapToInt(Integer::intValue).findFirst();
    }

    @Override
    public void corregirUltima(UUID vehiculoId, int km) {
        jdbc.update("""
                update lectura_kilometraje set km = :km, corregida = true
                where id = (select max(id) from lectura_kilometraje where vehiculo_id = :vehiculo)""",
                Map.of("vehiculo", vehiculoId, "km", km));
    }
}
