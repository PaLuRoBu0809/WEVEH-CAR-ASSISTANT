package co.weveh.cuentas.domain;

import co.weveh.shared.domain.DatoInvalidoException;
import co.weveh.shared.domain.UsuarioId;

/**
 * Perfil de la persona (ADR 0005). Datos mínimos: solo el nombre; el correo y la contraseña viven en Supabase Auth.
 */
public record Usuario(UsuarioId id, String nombre) {

    public static final int LARGO_MAXIMO_NOMBRE = 80;

    public Usuario {
        nombre = validarNombre(nombre);
    }

    public Usuario conNombre(String nuevoNombre) {
        return new Usuario(id, nuevoNombre);
    }

    private static String validarNombre(String nombre) {
        var limpio = nombre == null ? "" : nombre.strip().replaceAll("\\s+", " ");
        if (limpio.isEmpty()) {
            throw new DatoInvalidoException("Escribe tu nombre");
        }
        if (limpio.length() > LARGO_MAXIMO_NOMBRE) {
            throw new DatoInvalidoException("El nombre puede tener máximo " + LARGO_MAXIMO_NOMBRE + " caracteres");
        }
        return limpio;
    }
}
