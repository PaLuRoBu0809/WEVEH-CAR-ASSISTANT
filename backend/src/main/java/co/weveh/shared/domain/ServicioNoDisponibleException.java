package co.weveh.shared.domain;

/**
 * Un servicio externo (por ejemplo el proveedor de IA) no está configurado o no responde.
 */
public class ServicioNoDisponibleException extends RuntimeException {

    public ServicioNoDisponibleException(String mensaje) {
        super(mensaje);
    }
}
