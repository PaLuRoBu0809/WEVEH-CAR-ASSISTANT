package co.weveh.garaje.infrastructure.persistencia;

import co.weveh.garaje.application.puertos.VehiculoRepositorio;
import co.weveh.garaje.domain.Combustible;
import co.weveh.garaje.domain.RegistroInicial;
import co.weveh.garaje.domain.Traccion;
import co.weveh.garaje.domain.Transmision;
import co.weveh.garaje.domain.UsoVehiculo;
import co.weveh.garaje.domain.Vehiculo;
import co.weveh.shared.domain.DispositivoId;
import co.weveh.shared.domain.Kilometraje;
import co.weveh.shared.domain.TipoVehiculo;
import java.sql.Date;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Repository;

/**
 * Adaptador de la tabla vehiculo. Cada consulta filtra por dispositivo_id.
 */
@Repository
class VehiculoRepositorioJdbc implements VehiculoRepositorio {

    private static final String COLUMNAS = """
            id, dispositivo_id, tipo, catalogo_linea_id, marca, linea, cilindrada_cc, anio_modelo, combustible,
            transmision, traccion, alias, placa, fecha_matricula, km, uso, km_promedio_mes, registro_aceite_km,
            registro_aceite_fecha, registro_soat_fecha, registro_rtm_fecha, registro_rtm_aun_no_aplica,
            registro_seguro_inicio, registro_seguro_entidad, version_fila""";

    private final JdbcClient jdbc;

    VehiculoRepositorioJdbc(JdbcClient jdbc) {
        this.jdbc = jdbc;
    }

    @Override
    public List<Vehiculo> buscarPorDispositivo(DispositivoId dispositivo) {
        return jdbc.sql("select " + COLUMNAS + " from vehiculo where dispositivo_id = ? order by creado_en")
                .param(dispositivo.valor())
                .query((fila, n) -> mapear(fila))
                .list();
    }

    @Override
    public Optional<Vehiculo> buscar(DispositivoId dispositivo, UUID vehiculoId) {
        return jdbc.sql("select " + COLUMNAS + " from vehiculo where id = ? and dispositivo_id = ?")
                .param(vehiculoId)
                .param(dispositivo.valor())
                .query((fila, n) -> mapear(fila))
                .optional();
    }

    @Override
    public void insertar(Vehiculo v) {
        var r = v.registroInicial();
        jdbc.sql("insert into vehiculo (" + COLUMNAS + ") values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)")
                .params(v.id(), v.dispositivo().valor(), v.tipo().name(), v.catalogoLineaId(), v.marca(), v.linea(),
                        v.cilindradaCc(), v.anioModelo(), nombre(v.combustible()), nombre(v.transmision()),
                        v.traccion() == null ? null : v.traccion().codigo(), v.alias(), v.placa(),
                        v.fechaMatricula(), v.km().valor(), v.uso().name(), v.kmPromedioMes(), r.aceiteKm(),
                        r.aceiteFecha(), r.soatFecha(), r.rtmFecha(), r.rtmAunNoAplica(), r.seguroInicio(),
                        r.seguroEntidad(), v.versionFila())
                .update();
    }

    @Override
    public boolean actualizar(Vehiculo v) {
        return jdbc.sql("""
                        update vehiculo
                        set alias = ?, placa = ?, uso = ?, km_promedio_mes = ?, fecha_matricula = ?, version_fila = version_fila + 1
                        where id = ? and dispositivo_id = ? and version_fila = ?""")
                .params(v.alias(), v.placa(), v.uso().name(), v.kmPromedioMes(), v.fechaMatricula(), v.id(),
                        v.dispositivo().valor(), v.versionFila())
                .update() == 1;
    }

    @Override
    public boolean eliminar(DispositivoId dispositivo, UUID vehiculoId) {
        return jdbc.sql("delete from vehiculo where id = ? and dispositivo_id = ?")
                .param(vehiculoId)
                .param(dispositivo.valor())
                .update() == 1;
    }

    private static Vehiculo mapear(ResultSet fila) throws SQLException {
        var registro = new RegistroInicial(
                fila.getObject("registro_aceite_km", Integer.class),
                fecha(fila, "registro_aceite_fecha"),
                fecha(fila, "registro_soat_fecha"),
                fecha(fila, "registro_rtm_fecha"),
                fila.getBoolean("registro_rtm_aun_no_aplica"),
                fecha(fila, "registro_seguro_inicio"),
                fila.getString("registro_seguro_entidad"));
        return new Vehiculo(
                fila.getObject("id", UUID.class),
                new DispositivoId(fila.getObject("dispositivo_id", UUID.class)),
                TipoVehiculo.valueOf(fila.getString("tipo")),
                fila.getObject("catalogo_linea_id", Long.class),
                fila.getString("marca"),
                fila.getString("linea"),
                fila.getObject("cilindrada_cc", Integer.class),
                fila.getInt("anio_modelo"),
                enumerado(Combustible.class, fila.getString("combustible")),
                enumerado(Transmision.class, fila.getString("transmision")),
                Traccion.desdeCodigo(fila.getString("traccion")),
                fila.getString("alias"),
                fila.getString("placa"),
                fecha(fila, "fecha_matricula"),
                new Kilometraje(fila.getInt("km")),
                UsoVehiculo.valueOf(fila.getString("uso")),
                fila.getInt("km_promedio_mes"),
                registro,
                fila.getInt("version_fila"));
    }

    private static LocalDate fecha(ResultSet fila, String columna) throws SQLException {
        Date fecha = fila.getDate(columna);
        return fecha == null ? null : fecha.toLocalDate();
    }

    private static <E extends Enum<E>> E enumerado(Class<E> tipo, String valor) {
        return valor == null ? null : Enum.valueOf(tipo, valor);
    }

    private static String nombre(Enum<?> valor) {
        return valor == null ? null : valor.name();
    }
}
