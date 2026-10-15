package co.weveh.shared.domain;

import java.util.Objects;
import java.util.UUID;

/**
 * Identificador de la persona: el {@code sub} del token de Supabase Auth (docs/adr/0005). Todo se filtra por él.
 */
public record UsuarioId(UUID valor) {

    public UsuarioId {
        Objects.requireNonNull(valor, "valor");
    }

    /** @throws NoAutenticadoException si el texto no es un UUID: el token no identifica a nadie */
    public static UsuarioId desdeTexto(String texto) {
        if (texto == null) {
            throw new NoAutenticadoException();
        }
        try {
            return new UsuarioId(UUID.fromString(texto));
        } catch (IllegalArgumentException sinIdentidad) {
            throw new NoAutenticadoException();
        }
    }

    @Override
    public String toString() {
        return valor.toString();
    }
}
