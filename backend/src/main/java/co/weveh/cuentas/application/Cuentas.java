package co.weveh.cuentas.application;

import co.weveh.cuentas.domain.Consentimiento;
import co.weveh.cuentas.domain.Usuario;
import co.weveh.shared.domain.UsuarioId;
import java.time.Instant;
import java.util.List;

/**
 * Casos de uso de la cuenta (RF-CTA, RF-DAT). El inicio de sesión lo hace la app con Supabase Auth; aquí vive el
 * perfil, la autorización de datos y eliminar la cuenta.
 */
public interface Cuentas {

    /**
     * Crea el perfil y registra la aceptación de la política (RF-DAT-02). Si el perfil ya existe lo devuelve sin
     * cambios: la app puede reintentar sin duplicar nada.
     */
    Cuenta crear(UsuarioId usuario, String nombre, String versionPolitica, Instant aceptadoEn);

    Cuenta obtener(UsuarioId usuario);

    Cuenta editarNombre(UsuarioId usuario, String nombre);

    /** RF-DAT-03: la persona acepta una versión nueva de la política. */
    Cuenta aceptarPolitica(UsuarioId usuario, String versionPolitica);

    /**
     * RF-DAT-06: borra la cuenta y todo lo suyo, aquí y en Supabase Auth.
     *
     * @param sesionIniciadaEn cuándo se emitió el token; debe ser reciente (RF-CTA-05)
     */
    void eliminar(UsuarioId usuario, Instant sesionIniciadaEn);

    record Cuenta(Usuario usuario, List<Consentimiento> consentimientos) {
    }
}
