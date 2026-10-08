package co.weveh.shared.domain;

public class DispositivoInvalidoException extends RuntimeException {

    public DispositivoInvalidoException() {
        super("El header X-Weveh-Dispositivo debe ser un UUID v4");
    }
}
