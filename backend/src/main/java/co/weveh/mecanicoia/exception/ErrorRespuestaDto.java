package co.weveh.mecanicoia.exception;

import java.time.Instant;

/**
 * Payload uniforme de error devuelto al frontend. Nunca incluye stacktrace ni
 * detalles internos (API keys, URLs de proveedores) para no filtrar configuracion.
 */
public record ErrorRespuestaDto(String codigo, String mensaje, Instant timestamp) {

    public ErrorRespuestaDto(String codigo, String mensaje) {
        this(codigo, mensaje, Instant.now());
    }
}
