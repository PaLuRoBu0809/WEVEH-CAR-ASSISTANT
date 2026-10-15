package co.weveh.shared.domain;

/** La petición no trae una sesión válida (RF-CTA-04): se responde 401. */
public class NoAutenticadoException extends RuntimeException {

    public NoAutenticadoException() {
        super("Tu sesión no es válida o venció. Inicia sesión de nuevo");
    }
}
