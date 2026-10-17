package co.weveh.shared.domain;

/**
 * El cambio es posible pero raro: la persona debe confirmarlo y volver a enviarlo (por ejemplo, un salto grande del
 * kilometraje, RF-GAR-05). Se responde 409 con el texto para preguntar.
 */
public class ConfirmacionRequeridaException extends RuntimeException {

    public ConfirmacionRequeridaException(String pregunta) {
        super(pregunta);
    }
}
