package co.weveh.garaje.application;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import co.weveh.garaje.KilometrajeActualizado;
import co.weveh.garaje.VehiculoEliminado;
import co.weveh.garaje.VehiculoRegistrado;
import co.weveh.garaje.application.puertos.VehiculoRepositorio;
import co.weveh.garaje.domain.RegistroInicial;
import co.weveh.garaje.domain.Traccion;
import co.weveh.garaje.domain.Transmision;
import co.weveh.garaje.domain.UsoVehiculo;
import co.weveh.garaje.domain.Vehiculo;
import co.weveh.shared.domain.ConflictoException;
import co.weveh.shared.domain.RecursoNoEncontradoException;
import co.weveh.shared.domain.TipoVehiculo;
import co.weveh.shared.domain.UsuarioId;
import java.time.Clock;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.context.ApplicationEventPublisher;

class GarajeServicioTest {

    private static final LocalDate HOY = LocalDate.of(2026, 10, 8);
    private static final UsuarioId USUARIO = UsuarioId.desdeTexto("3f1c9a2e-8b4d-4f6a-9c1e-2d7b5a0e4c11");
    private static final RegistroInicial REGISTRO = new RegistroInicial(188000, LocalDate.of(2026, 6, 5),
            LocalDate.of(2026, 6, 30), LocalDate.of(2026, 6, 28), false, LocalDate.of(2026, 7, 5), "Sura");

    private VehiculoRepositorio repositorio;
    private ApplicationEventPublisher eventos;
    private GarajeServicio servicio;

    @BeforeEach
    void preparar() {
        repositorio = mock(VehiculoRepositorio.class);
        eventos = mock(ApplicationEventPublisher.class);
        var reloj = Clock.fixed(HOY.atStartOfDay().toInstant(ZoneOffset.UTC), ZoneOffset.UTC);
        servicio = new GarajeServicio(repositorio, eventos, reloj);
    }

    private static Vehiculo.DatosRegistro datos(RegistroInicial registro) {
        return new Vehiculo.DatosRegistro(TipoVehiculo.CARRO, 7811L, "TOYOTA", "PRADO VX 5P AT", 3400, 2008, null,
                Transmision.AUTOMATICA, Traccion.TRACCION_4X4, "La Prado", "ABC123", null, 190000, null, null,
                registro);
    }

    private static Vehiculo prado() {
        return Vehiculo.registrar(UUID.randomUUID(), USUARIO, datos(REGISTRO), HOY);
    }

    private Vehiculo guardado() {
        var vehiculo = prado();
        when(repositorio.buscar(USUARIO, vehiculo.id())).thenReturn(Optional.of(vehiculo));
        return vehiculo;
    }

    @Test
    void listarDevuelveLosVehiculosDelUsuario() {
        var vehiculo = prado();
        when(repositorio.buscarPorUsuario(USUARIO)).thenReturn(List.of(vehiculo));

        assertThat(servicio.listar(USUARIO)).containsExactly(vehiculo);
    }

    @Test
    void obtenerUnVehiculoAjenoOInexistenteResponde404() {
        var id = UUID.randomUUID();
        when(repositorio.buscar(USUARIO, id)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> servicio.obtener(USUARIO, id))
                .isInstanceOf(RecursoNoEncontradoException.class)
                .hasMessage("No encontramos ese vehículo en tu garaje");
    }

    @Test
    void registrarGuardaYPublicaElEvento() {
        var vehiculo = servicio.registrar(USUARIO, datos(REGISTRO));

        assertThat(vehiculo.kmActualizadoEn()).isEqualTo(HOY);
        assertThat(vehiculo.usuario()).isEqualTo(USUARIO);
        verify(repositorio).insertar(vehiculo);
        verify(eventos).publishEvent(new VehiculoRegistrado(vehiculo.id()));
    }

    @Test
    void editarConLaVersionActualGuardaLosCambios() {
        var vehiculo = guardado();
        when(repositorio.actualizar(any())).thenReturn(true);

        servicio.editar(USUARIO, vehiculo.id(),
                new Garaje.Edicion(new Vehiculo.DatosEdicion("Prado", "XYZ987", UsoVehiculo.CIUDAD, 1500, null, null, null, null), vehiculo.versionFila()));

        verify(repositorio).actualizar(org.mockito.ArgumentMatchers.argThat(
                v -> "Prado".equals(v.alias()) && "XYZ987".equals(v.placa()) && v.kmPromedioMes() == 1500));
    }

    @Test
    void editarConVersionViejaRespondeConflictoSinGuardar() {
        var vehiculo = guardado();

        assertThatThrownBy(() -> servicio.editar(USUARIO, vehiculo.id(),
                new Garaje.Edicion(new Vehiculo.DatosEdicion("Prado", null, UsoVehiculo.MIXTO, 1000, null, null, null, null), vehiculo.versionFila() + 1)))
                .isInstanceOf(ConflictoException.class);
        verify(repositorio, never()).actualizar(any());
    }

    @Test
    void editarRespondeConflictoSiOtraEdicionGanoAlGuardar() {
        var vehiculo = guardado();
        when(repositorio.actualizar(any())).thenReturn(false);

        assertThatThrownBy(() -> servicio.editar(USUARIO, vehiculo.id(),
                new Garaje.Edicion(new Vehiculo.DatosEdicion("Prado", null, UsoVehiculo.MIXTO, 1000, null, null, null, null), vehiculo.versionFila())))
                .isInstanceOf(ConflictoException.class);
    }

    @Test
    void completarRegistroGuardaElAceiteYLosPapeles() {
        var vehiculo = Vehiculo.registrar(UUID.randomUUID(), USUARIO, datos(null), HOY);
        when(repositorio.buscar(USUARIO, vehiculo.id())).thenReturn(Optional.of(vehiculo));
        when(repositorio.actualizar(any())).thenReturn(true);

        servicio.completarRegistro(USUARIO, vehiculo.id(), REGISTRO, vehiculo.versionFila());

        verify(repositorio).actualizar(org.mockito.ArgumentMatchers.argThat(v -> REGISTRO.equals(v.registroInicial())));
    }

    @Test
    void completarRegistroConVersionViejaOGuardadoFallidoRespondeConflicto() {
        var vehiculo = guardado();

        assertThatThrownBy(() -> servicio.completarRegistro(USUARIO, vehiculo.id(), REGISTRO, 99))
                .isInstanceOf(ConflictoException.class);

        when(repositorio.actualizar(any())).thenReturn(false);
        assertThatThrownBy(() -> servicio.completarRegistro(USUARIO, vehiculo.id(), REGISTRO, vehiculo.versionFila()))
                .isInstanceOf(ConflictoException.class);
    }

    @Test
    void actualizarKilometrajeGuardaYPublicaElEvento() {
        var vehiculo = guardado();
        when(repositorio.actualizar(any())).thenReturn(true);

        servicio.actualizarKilometraje(USUARIO, vehiculo.id(), 190500, false);

        verify(repositorio).actualizar(org.mockito.ArgumentMatchers.argThat(v -> v.km().valor() == 190500));
        verify(eventos).publishEvent(new KilometrajeActualizado(vehiculo.id(), 190500));
    }

    @Test
    void actualizarKilometrajeSinGuardarNoPublicaElEvento() {
        var vehiculo = guardado();
        when(repositorio.actualizar(any())).thenReturn(false);

        assertThatThrownBy(() -> servicio.actualizarKilometraje(USUARIO, vehiculo.id(), 190500, false))
                .isInstanceOf(ConflictoException.class);
        verify(eventos, never()).publishEvent(any());
    }

    @Test
    void eliminarPublicaElEventoOResponde404SiNoExistia() {
        var id = UUID.randomUUID();
        when(repositorio.eliminar(USUARIO, id)).thenReturn(true);

        servicio.eliminar(USUARIO, id);
        verify(eventos).publishEvent(new VehiculoEliminado(id));

        var otro = UUID.randomUUID();
        assertThatThrownBy(() -> servicio.eliminar(USUARIO, otro)).isInstanceOf(RecursoNoEncontradoException.class);
    }

    @Test
    void buscarExponeSoloLosDatosPublicosDelVehiculo() {
        var vehiculo = guardado();

        var datos = servicio.buscar(USUARIO, vehiculo.id()).orElseThrow();

        assertThat(datos.id()).isEqualTo(vehiculo.id());
        assertThat(datos.tipo()).isEqualTo("CARRO");
        assertThat(datos.combustible()).isNull();
        assertThat(datos.transmision()).isEqualTo("AUTOMATICA");
        assertThat(datos.traccion()).isEqualTo(Traccion.TRACCION_4X4.codigo());
        assertThat(datos.km()).isEqualTo(190000);
        assertThat(datos.aceiteKm()).isEqualTo(188000);
        assertThat(datos.soatFecha()).isEqualTo(REGISTRO.soatFecha());
    }

    @Test
    void buscarUnVehiculoInexistenteDevuelveVacio() {
        var id = UUID.randomUUID();
        when(repositorio.buscar(USUARIO, id)).thenReturn(Optional.empty());

        assertThat(servicio.buscar(USUARIO, id)).isEmpty();
    }
}
