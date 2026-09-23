package co.weveh.mecanicoia.exception;

/**
 * El LLM respondio, pero el contenido no es utilizable: JSON malformado,
 * nivel_gravedad fuera de las 3 opciones permitidas, o campos requeridos ausentes.
 * Se traduce a 502 Bad Gateway, igual que LlmIndisponibleException: desde la
 * perspectiva del frontend, ambos son "el LLM no entrego nada usable".
 */
public class RespuestaLlmInvalidaException extends RuntimeException {

    public RespuestaLlmInvalidaException(String mensaje) {
        super(mensaje);
    }

    public RespuestaLlmInvalidaException(String mensaje, Throwable causa) {
        super(mensaje, causa);
    }
}
