package co.weveh.shared.domain;

/** Una acción delicada (eliminar la cuenta) exige haber iniciado sesión hace poco (RF-CTA-05): se responde 401. */
public class IdentidadNoConfirmadaException extends RuntimeException {

    public IdentidadNoConfirmadaException() {
        super("Por seguridad, vuelve a iniciar sesión para confirmar que eres tú");
    }
}
