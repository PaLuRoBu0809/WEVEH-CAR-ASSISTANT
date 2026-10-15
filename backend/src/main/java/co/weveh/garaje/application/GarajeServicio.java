package co.weveh.garaje.application;

import co.weveh.garaje.GarajeApi;
import co.weveh.garaje.VehiculoEliminado;
import co.weveh.garaje.VehiculoRegistrado;
import co.weveh.garaje.application.puertos.VehiculoRepositorio;
import co.weveh.garaje.domain.Vehiculo;
import co.weveh.shared.domain.ConflictoException;
import co.weveh.shared.domain.RecursoNoEncontradoException;
import co.weveh.shared.domain.UsuarioId;
import java.time.Clock;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional
class GarajeServicio implements Garaje, GarajeApi {

    private final VehiculoRepositorio repositorio;
    private final ApplicationEventPublisher eventos;
    private final Clock reloj;

    GarajeServicio(VehiculoRepositorio repositorio, ApplicationEventPublisher eventos, Clock reloj) {
        this.repositorio = repositorio;
        this.eventos = eventos;
        this.reloj = reloj;
    }

    @Override
    @Transactional(readOnly = true)
    public List<Vehiculo> listar(UsuarioId usuario) {
        return repositorio.buscarPorUsuario(usuario);
    }

    @Override
    @Transactional(readOnly = true)
    public Vehiculo obtener(UsuarioId usuario, UUID vehiculoId) {
        return repositorio.buscar(usuario, vehiculoId).orElseThrow(GarajeServicio::noEncontrado);
    }

    @Override
    public Vehiculo registrar(UsuarioId usuario, Vehiculo.DatosRegistro datos) {
        var vehiculo = Vehiculo.registrar(UUID.randomUUID(), usuario, datos, LocalDate.now(reloj));
        repositorio.insertar(vehiculo);
        eventos.publishEvent(new VehiculoRegistrado(vehiculo.id()));
        return vehiculo;
    }

    @Override
    public Vehiculo editar(UsuarioId usuario, UUID vehiculoId, Edicion edicion) {
        var actual = obtener(usuario, vehiculoId);
        if (actual.versionFila() != edicion.versionFila()) {
            throw conflicto();
        }
        var editado = actual.editar(edicion.alias(), edicion.placa(), edicion.uso(), edicion.kmPromedioMes(),
                edicion.fechaMatricula(), LocalDate.now(reloj));
        if (!repositorio.actualizar(editado)) {
            throw conflicto();
        }
        return obtener(usuario, vehiculoId);
    }

    @Override
    public void eliminar(UsuarioId usuario, UUID vehiculoId) {
        if (!repositorio.eliminar(usuario, vehiculoId)) {
            throw noEncontrado();
        }
        eventos.publishEvent(new VehiculoEliminado(vehiculoId));
    }

    @Override
    @Transactional(readOnly = true)
    public Optional<DatosVehiculo> buscar(UsuarioId usuario, UUID vehiculoId) {
        return repositorio.buscar(usuario, vehiculoId).map(GarajeServicio::datosPublicos);
    }

    private static DatosVehiculo datosPublicos(Vehiculo v) {
        var registro = v.registroInicial();
        return new DatosVehiculo(v.id(), v.tipo().name(), v.marca(), v.linea(), v.cilindradaCc(), v.anioModelo(),
                v.combustible() == null ? null : v.combustible().name(),
                v.transmision() == null ? null : v.transmision().name(),
                v.traccion() == null ? null : v.traccion().codigo(),
                v.km().valor(), v.uso().name(), v.kmPromedioMes(),
                registro.aceiteKm(), registro.aceiteFecha(), registro.soatFecha(), registro.rtmFecha(),
                registro.rtmAunNoAplica());
    }

    private static RecursoNoEncontradoException noEncontrado() {
        return new RecursoNoEncontradoException("No encontramos ese vehículo en tu garaje");
    }

    private static ConflictoException conflicto() {
        return new ConflictoException("Alguien más cambió este vehículo. Revisa los datos actuales e intenta de nuevo.");
    }
}
