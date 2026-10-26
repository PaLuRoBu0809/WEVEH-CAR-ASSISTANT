package co.weveh.shared.domain;

/** RF-MIA-07: la cuenta llegó al tope diario de uso de la IA; solo frena un error o un abuso. */
public class LimiteDiarioException extends RuntimeException {

    public LimiteDiarioException() {
        super("Por hoy llegaste al máximo de mensajes. Vuelve mañana.");
    }
}
