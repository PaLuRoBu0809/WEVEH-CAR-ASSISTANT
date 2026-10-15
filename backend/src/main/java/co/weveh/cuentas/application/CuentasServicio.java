package co.weveh.cuentas.application;

import co.weveh.cuentas.application.puertos.ProveedorIdentidad;
import co.weveh.cuentas.application.puertos.UsuarioRepositorio;
import co.weveh.cuentas.domain.Consentimiento;
import co.weveh.cuentas.domain.MedioConsentimiento;
import co.weveh.cuentas.domain.Usuario;
import co.weveh.shared.domain.IdentidadNoConfirmadaException;
import co.weveh.shared.domain.RecursoNoEncontradoException;
import co.weveh.shared.domain.UsuarioId;
import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional
class CuentasServicio implements Cuentas {

    /** RF-CTA-05: para eliminar la cuenta hay que haber iniciado sesión hace máximo este tiempo. */
    static final Duration SESION_RECIENTE = Duration.ofMinutes(5);

    private final UsuarioRepositorio repositorio;
    private final ProveedorIdentidad identidad;
    private final Clock reloj;

    CuentasServicio(UsuarioRepositorio repositorio, ProveedorIdentidad identidad, Clock reloj) {
        this.repositorio = repositorio;
        this.identidad = identidad;
        this.reloj = reloj;
    }

    @Override
    public Cuenta crear(UsuarioId usuario, String nombre, String versionPolitica, Instant aceptadoEn) {
        var ahora = reloj.instant();
        var cuando = aceptadoEn == null || aceptadoEn.isAfter(ahora) ? ahora : aceptadoEn;
        var consentimiento = new Consentimiento(UUID.randomUUID(), usuario, versionPolitica, cuando,
                MedioConsentimiento.APP_REGISTRO);
        if (repositorio.insertar(new Usuario(usuario, nombre))) {
            repositorio.guardar(consentimiento);
        }
        return obtener(usuario);
    }

    @Override
    @Transactional(readOnly = true)
    public Cuenta obtener(UsuarioId usuario) {
        var perfil = repositorio.buscar(usuario).orElseThrow(CuentasServicio::sinPerfil);
        return new Cuenta(perfil, repositorio.consentimientos(usuario));
    }

    @Override
    public Cuenta editarNombre(UsuarioId usuario, String nombre) {
        var perfil = repositorio.buscar(usuario).orElseThrow(CuentasServicio::sinPerfil);
        repositorio.actualizar(perfil.conNombre(nombre));
        return obtener(usuario);
    }

    @Override
    public Cuenta aceptarPolitica(UsuarioId usuario, String versionPolitica) {
        repositorio.buscar(usuario).orElseThrow(CuentasServicio::sinPerfil);
        repositorio.guardar(new Consentimiento(UUID.randomUUID(), usuario, versionPolitica, reloj.instant(),
                MedioConsentimiento.APP_NUEVA_VERSION));
        return obtener(usuario);
    }

    @Override
    public void eliminar(UsuarioId usuario, Instant sesionIniciadaEn) {
        if (sesionIniciadaEn == null || sesionIniciadaEn.isBefore(reloj.instant().minus(SESION_RECIENTE))) {
            throw new IdentidadNoConfirmadaException();
        }
        repositorio.eliminar(usuario);
        // Si Supabase falla, la excepción deshace el borrado de arriba: nada queda a medias
        identidad.eliminarUsuario(usuario);
    }

    private static RecursoNoEncontradoException sinPerfil() {
        return new RecursoNoEncontradoException("Aún no has completado tu cuenta");
    }
}
