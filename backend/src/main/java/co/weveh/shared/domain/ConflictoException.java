package co.weveh.shared.domain;

/**
 * El cambio choca con el estado actual (por ejemplo, otra copia de la app editó antes).
 */
public class ConflictoException extends RuntimeException {

    public ConflictoException(String mensaje) {
        super(mensaje);
    }
}
