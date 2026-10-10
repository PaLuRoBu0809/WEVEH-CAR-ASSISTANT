package co.weveh.shared.domain;

/**
 * Un dato que rompe una regla de negocio. El mensaje se muestra a la persona: sin jerga.
 */
public class DatoInvalidoException extends RuntimeException {

    public DatoInvalidoException(String mensaje) {
        super(mensaje);
    }
}
