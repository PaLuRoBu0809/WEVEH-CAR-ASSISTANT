package co.weveh.shared.domain;

import java.util.UUID;
import java.util.regex.Pattern;

/**
 * Identificador del dispositivo que hace la petición (UUID v4). No es autenticación: ver docs/adr/0002.
 */
public record DispositivoId(UUID valor) {

    private static final Pattern UUID_V4 = Pattern.compile(
            "^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$",
            Pattern.CASE_INSENSITIVE);

    public DispositivoId {
        if (valor == null || valor.version() != 4 || valor.variant() != 2) {
            throw new DispositivoInvalidoException();
        }
    }

    public static DispositivoId desdeTexto(String texto) {
        if (texto == null || !UUID_V4.matcher(texto.strip()).matches()) {
            throw new DispositivoInvalidoException();
        }
        return new DispositivoId(UUID.fromString(texto.strip()));
    }

    @Override
    public String toString() {
        return valor.toString();
    }
}
