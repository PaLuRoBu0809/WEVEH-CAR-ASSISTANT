package co.weveh.shared.domain;

/**
 * El recurso no existe o es de otro usuario: en ambos casos se responde 404 (docs/adr/0005).
 */
public class RecursoNoEncontradoException extends RuntimeException {

    public RecursoNoEncontradoException(String mensaje) {
        super(mensaje);
    }
}
