package co.weveh.cuentas.application;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import co.weveh.cuentas.application.puertos.ProveedorIdentidad;
import co.weveh.cuentas.application.puertos.UsuarioRepositorio;
import co.weveh.cuentas.domain.Consentimiento;
import co.weveh.cuentas.domain.MedioConsentimiento;
import co.weveh.cuentas.domain.Usuario;
import co.weveh.shared.domain.DatoInvalidoException;
import co.weveh.shared.domain.IdentidadNoConfirmadaException;
import co.weveh.shared.domain.RecursoNoEncontradoException;
import co.weveh.shared.domain.ServicioNoDisponibleException;
import co.weveh.shared.domain.UsuarioId;
import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.time.ZoneOffset;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import org.junit.jupiter.api.Test;

/** RF-CTA-05, RF-CTA-07, RF-DAT-02, RF-DAT-03 y RF-DAT-06 con dobles en memoria. */
class CuentasServicioTest {

    static final Instant AHORA = Instant.parse("2026-10-15T15:00:00Z");
    static final UsuarioId LAURA = new UsuarioId(UUID.fromString("3f1c9a2e-8b4d-4f6a-9c1e-2d7b5a0e4c11"));
    static final String POLITICA = "0.1-borrador";

    final RepositorioEnMemoria repositorio = new RepositorioEnMemoria();
    final ProveedorFalso identidad = new ProveedorFalso();
    final CuentasServicio servicio = new CuentasServicio(repositorio, identidad, Clock.fixed(AHORA, ZoneOffset.UTC));

    @Test
    void crearGuardaElPerfilYLaAceptacionDeLaPolitica() {
        var marcoLaCasilla = AHORA.minusSeconds(90);

        var cuenta = servicio.crear(LAURA, "  Laura  ", POLITICA, marcoLaCasilla);

        assertThat(cuenta.usuario().nombre()).isEqualTo("Laura");
        assertThat(cuenta.consentimientos()).singleElement().satisfies(c -> {
            assertThat(c.versionPolitica()).isEqualTo(POLITICA);
            assertThat(c.aceptadoEn()).isEqualTo(marcoLaCasilla);
            assertThat(c.medio()).isEqualTo(MedioConsentimiento.APP_REGISTRO);
        });
    }

    @Test
    void crearDosVecesNoDuplicaNada() {
        servicio.crear(LAURA, "Laura", POLITICA, AHORA);

        var otraVez = servicio.crear(LAURA, "Otro nombre", POLITICA, AHORA);

        assertThat(otraVez.usuario().nombre()).isEqualTo("Laura");
        assertThat(otraVez.consentimientos()).hasSize(1);
    }

    @Test
    void unaFechaDeAceptacionEnElFuturoSeCambiaPorLaDelServidor() {
        var cuenta = servicio.crear(LAURA, "Laura", POLITICA, AHORA.plus(Duration.ofDays(3)));

        assertThat(cuenta.consentimientos().getFirst().aceptadoEn()).isEqualTo(AHORA);
    }

    @Test
    void sinNombreNoSeCreaLaCuenta() {
        assertThatThrownBy(() -> servicio.crear(LAURA, "   ", POLITICA, AHORA))
                .isInstanceOf(DatoInvalidoException.class)
                .hasMessage("Escribe tu nombre");
    }

    @Test
    void sinPerfilLaCuentaNoExiste() {
        assertThatThrownBy(() -> servicio.obtener(LAURA)).isInstanceOf(RecursoNoEncontradoException.class);
    }

    @Test
    void editarElNombre() {
        servicio.crear(LAURA, "Laura", POLITICA, AHORA);

        assertThat(servicio.editarNombre(LAURA, "Laura Gómez").usuario().nombre()).isEqualTo("Laura Gómez");
    }

    @Test
    void aceptarUnaVersionNuevaDeLaPolitica() {
        servicio.crear(LAURA, "Laura", POLITICA, AHORA);

        var cuenta = servicio.aceptarPolitica(LAURA, "1.0");

        assertThat(cuenta.consentimientos()).extracting(Consentimiento::versionPolitica).containsExactly(POLITICA, "1.0");
        assertThat(cuenta.consentimientos().getLast().medio()).isEqualTo(MedioConsentimiento.APP_NUEVA_VERSION);
    }

    @Test
    void eliminarConSesionRecienteBorraAquiYEnSupabase() {
        servicio.crear(LAURA, "Laura", POLITICA, AHORA);

        servicio.eliminar(LAURA, AHORA.minus(Duration.ofMinutes(2)));

        assertThat(repositorio.buscar(LAURA)).isEmpty();
        assertThat(identidad.eliminados).containsExactly(LAURA);
    }

    @Test
    void eliminarConUnaSesionViejaPideConfirmarLaIdentidad() {
        servicio.crear(LAURA, "Laura", POLITICA, AHORA);

        assertThatThrownBy(() -> servicio.eliminar(LAURA, AHORA.minus(Duration.ofMinutes(30))))
                .isInstanceOf(IdentidadNoConfirmadaException.class);
        assertThat(repositorio.buscar(LAURA)).isPresent();
        assertThat(identidad.eliminados).isEmpty();
    }

    @Test
    void siSupabaseFallaElErrorLlegaParaDeshacerElBorrado() {
        servicio.crear(LAURA, "Laura", POLITICA, AHORA);
        identidad.disponible = false;

        assertThatThrownBy(() -> servicio.eliminar(LAURA, AHORA)).isInstanceOf(ServicioNoDisponibleException.class);
    }

    static class RepositorioEnMemoria implements UsuarioRepositorio {

        final Map<UsuarioId, Usuario> usuarios = new HashMap<>();
        final List<Consentimiento> consentimientos = new ArrayList<>();

        @Override
        public Optional<Usuario> buscar(UsuarioId usuario) {
            return Optional.ofNullable(usuarios.get(usuario));
        }

        @Override
        public boolean insertar(Usuario usuario) {
            return usuarios.putIfAbsent(usuario.id(), usuario) == null;
        }

        @Override
        public void actualizar(Usuario usuario) {
            usuarios.put(usuario.id(), usuario);
        }

        @Override
        public List<Consentimiento> consentimientos(UsuarioId usuario) {
            return consentimientos.stream().filter(c -> c.usuario().equals(usuario)).toList();
        }

        @Override
        public void guardar(Consentimiento consentimiento) {
            consentimientos.add(consentimiento);
        }

        @Override
        public void eliminar(UsuarioId usuario) {
            usuarios.remove(usuario);
            consentimientos.removeIf(c -> c.usuario().equals(usuario));
        }
    }

    static class ProveedorFalso implements ProveedorIdentidad {

        final List<UsuarioId> eliminados = new ArrayList<>();
        boolean disponible = true;

        @Override
        public void eliminarUsuario(UsuarioId usuario) {
            if (!disponible) {
                throw new ServicioNoDisponibleException("no disponible");
            }
            eliminados.add(usuario);
        }
    }
}
