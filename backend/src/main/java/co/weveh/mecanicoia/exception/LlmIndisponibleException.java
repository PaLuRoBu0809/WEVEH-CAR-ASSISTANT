package co.weveh.mecanicoia.exception;

/**
 * El proveedor del LLM (OpenRouter) no respondio: timeout, error 5xx, rate limit
 * o cualquier fallo de red. Se traduce a un 502 Bad Gateway: el backend de Weveh
 * esta disponible, pero su dependencia externa fallo.
 */
public class LlmIndisponibleException extends RuntimeException {

    public LlmIndisponibleException(String mensaje, Throwable causa) {
        super(mensaje, causa);
    }

    public LlmIndisponibleException(String mensaje) {
        super(mensaje);
    }
}
