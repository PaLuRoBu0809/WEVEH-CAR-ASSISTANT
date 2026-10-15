package co.weveh.garaje.infrastructure.persistencia;

import co.weveh.garaje.application.puertos.VehiculoRepositorio;
import co.weveh.garaje.domain.Combustible;
import co.weveh.garaje.domain.RegistroInicial;
import co.weveh.garaje.domain.Traccion;
import co.weveh.garaje.domain.Transmision;
import co.weveh.garaje.domain.UsoVehiculo;
import co.weveh.garaje.domain.Vehiculo;
import co.weveh.garaje.infrastructure.persistencia.VehiculoFila.RegistroFila;
import co.weveh.shared.domain.DispositivoId;
import co.weveh.shared.domain.Kilometraje;
import co.weveh.shared.domain.TipoVehiculo;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.dao.OptimisticLockingFailureException;
import org.springframework.stereotype.Repository;

/**
 * Adaptador de la tabla vehiculo con Spring Data JDBC (ADR 0006). Cada lectura filtra por dispositivo.
 */
@Repository
class VehiculoRepositorioSpringData implements VehiculoRepositorio {

    private final VehiculoFilaRepositorio filas;

    VehiculoRepositorioSpringData(VehiculoFilaRepositorio filas) {
        this.filas = filas;
    }

    @Override
    public List<Vehiculo> buscarPorDispositivo(DispositivoId dispositivo) {
        return filas.findByDispositivoIdOrderByCreadoEn(dispositivo.valor()).stream()
                .map(VehiculoRepositorioSpringData::aDominio)
                .toList();
    }

    @Override
    public Optional<Vehiculo> buscar(DispositivoId dispositivo, UUID vehiculoId) {
        return filas.findByIdAndDispositivoId(vehiculoId, dispositivo.valor()).map(VehiculoRepositorioSpringData::aDominio);
    }

    @Override
    public void insertar(Vehiculo vehiculo) {
        filas.save(aFila(vehiculo, null));
    }

    @Override
    public boolean actualizar(Vehiculo vehiculo) {
        try {
            filas.save(aFila(vehiculo, vehiculo.versionFila()));
            return true;
        } catch (OptimisticLockingFailureException otraEdicionGano) {
            return false;
        }
    }

    @Override
    public boolean eliminar(DispositivoId dispositivo, UUID vehiculoId) {
        return filas.eliminarDelDispositivo(vehiculoId, dispositivo.valor()) == 1;
    }

    private static VehiculoFila aFila(Vehiculo v, Integer version) {
        var r = v.registroInicial();
        var registro = new RegistroFila(r.aceiteKm(), r.aceiteFecha(), r.soatFecha(), r.rtmFecha(), r.rtmAunNoAplica(),
                r.seguroInicio(), r.seguroEntidad());
        return new VehiculoFila(v.id(), v.dispositivo().valor(), v.tipo().name(), v.catalogoLineaId(), v.marca(),
                v.linea(), v.cilindradaCc(), v.anioModelo(), nombre(v.combustible()), nombre(v.transmision()),
                v.traccion() == null ? null : v.traccion().codigo(), v.alias(), v.placa(), v.fechaMatricula(),
                v.km().valor(), v.uso().name(), v.kmPromedioMes(), registro, version, null);
    }

    private static Vehiculo aDominio(VehiculoFila f) {
        var r = f.registro();
        var registro = new RegistroInicial(r.aceiteKm(), r.aceiteFecha(), r.soatFecha(), r.rtmFecha(),
                r.rtmAunNoAplica(), r.seguroInicio(), r.seguroEntidad());
        return new Vehiculo(
                f.id(),
                new DispositivoId(f.dispositivoId()),
                TipoVehiculo.valueOf(f.tipo()),
                f.catalogoLineaId(),
                f.marca(),
                f.linea(),
                f.cilindradaCc(),
                f.anioModelo(),
                enumerado(Combustible.class, f.combustible()),
                enumerado(Transmision.class, f.transmision()),
                Traccion.desdeCodigo(f.traccion()),
                f.alias(),
                f.placa(),
                f.fechaMatricula(),
                new Kilometraje(f.km()),
                UsoVehiculo.valueOf(f.uso()),
                f.kmPromedioMes(),
                registro,
                f.versionFila());
    }

    private static <E extends Enum<E>> E enumerado(Class<E> tipo, String valor) {
        return valor == null ? null : Enum.valueOf(tipo, valor);
    }

    private static String nombre(Enum<?> valor) {
        return valor == null ? null : valor.name();
    }
}
