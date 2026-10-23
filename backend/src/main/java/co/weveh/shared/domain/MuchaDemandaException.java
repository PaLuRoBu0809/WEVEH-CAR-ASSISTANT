package co.weveh.shared.domain;

/** ADR 0010: el cupo de llamadas simultáneas a un servicio externo (por ejemplo, la IA) está lleno. */
public class MuchaDemandaException extends RuntimeException {

    public MuchaDemandaException() {
        super("Hay mucha demanda en este momento. Intenta de nuevo en un minuto.");
    }
}
