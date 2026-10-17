package co.weveh.cuentas.application.puertos;

import co.weveh.shared.domain.UsuarioId;

/** Quien guarda el correo y la contraseña (Supabase Auth, ADR 0005). */
public interface ProveedorIdentidad {

    /**
     * Borra la persona del proveedor; si ya no existía no es un error.
     *
     * @throws co.weveh.shared.domain.ServicioNoDisponibleException si el proveedor no responde o no está configurado
     */
    void eliminarUsuario(UsuarioId usuario);
}
