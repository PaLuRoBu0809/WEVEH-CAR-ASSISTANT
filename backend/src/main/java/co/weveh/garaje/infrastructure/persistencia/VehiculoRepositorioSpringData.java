package co.weveh.garaje.infrastructure.persistencia;

import co.weveh.garaje.application.puertos.VehiculoRepositorio;
import co.weveh.garaje.domain.Combustible;
import co.weveh.garaje.domain.RegistroInicial;
import co.weveh.garaje.domain.Traccion;
import co.weveh.garaje.domain.Transmision;
import co.weveh.garaje.domain.UsoVehiculo;
import co.weveh.garaje.domain.Vehiculo;
import co.weveh.garaje.infrastructure.persistencia.VehiculoFila.RegistroFila;
import co.weveh.shared.domain.ConflictoException;
import co.weveh.shared.domain.Kilometraje;
import co.weveh.shared.domain.TipoVehiculo;
import co.weveh.shared.domain.UsuarioId;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.dao.OptimisticLockingFailureException;
import org.springframework.stereotype.Repository;

/**
 * Adaptador de la tabla vehiculo con Spring Data JDBC (ADR 0006). Cada lectura filtra por usuario.
 */
@Repository
class VehiculoRepositorioSpringData implements VehiculoRepositorio {

    /** Llave foránea hacia usuario (V5): falla si la persona aún no creó su perfil de cuenta. */
    private static final String LLAVE_USUARIO = "vehiculo_usuario_fk";

    private final VehiculoFilaRepositorio filas;

    VehiculoRepositorioSpringData(VehiculoFilaRepositorio filas) {
        this.filas = filas;
    }

    @Override
    public List<Vehiculo> buscarPorUsuario(UsuarioId usuario) {
        return filas.findByUsuarioIdOrderByCreadoEn(usuario.valor()).stream()
                .map(VehiculoRepositorioSpringData::aDominio)
                .toList();
    }

    @Override
    public Optional<Vehiculo> buscar(UsuarioId usuario, UUID vehiculoId) {
        return filas.findByIdAndUsuarioId(vehiculoId, usuario.valor()).map(VehiculoRepositorioSpringData::aDominio);
    }

    @Override
    public void insertar(Vehiculo vehiculo) {
        try {
            filas.save(aFila(vehiculo, null));
        } catch (DataIntegrityViolationException error) {
            if (String.valueOf(error.getMessage()).contains(LLAVE_USUARIO)) {
                throw new ConflictoException("Completa tu cuenta antes de registrar un vehículo");
            }
            throw error;
        }
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
    public boolean eliminar(UsuarioId usuario, UUID vehiculoId) {
        return filas.eliminarDelUsuario(vehiculoId, usuario.valor()) == 1;
    }

    private static VehiculoFila aFila(Vehiculo v, Integer version) {
        var r = v.registroInicial();
        var registro = new RegistroFila(r.aceiteKm(), r.aceiteFecha(), r.soatFecha(), r.rtmFecha(), r.rtmAunNoAplica(),
                r.seguroInicio(), r.seguroEntidad());
        return new VehiculoFila(v.id(), v.usuario().valor(), v.tipo().name(), v.catalogoLineaId(), v.marca(),
                v.linea(), v.cilindradaCc(), v.anioModelo(), nombre(v.combustible()), nombre(v.transmision()),
                v.traccion() == null ? null : v.traccion().codigo(), v.alias(), v.placa(), v.fechaMatricula(),
                v.km().valor(), v.uso().name(), v.kmPromedioMes(), registro, version, null);
    }

    private static Vehiculo aDominio(VehiculoFila f) {
        var r = f.registro();
        var registro = r == null ? RegistroInicial.VACIO : new RegistroInicial(r.aceiteKm(), r.aceiteFecha(),
                r.soatFecha(), r.rtmFecha(), r.rtmAunNoAplica(), r.seguroInicio(), r.seguroEntidad());
        return new Vehiculo(
                f.id(),
                new UsuarioId(f.usuarioId()),
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
