package co.weveh.shared.domain;

/** ADR 0010: el módulo está apagado con {@code WEVEH_MODULO_<NOMBRE>=inactivo}. Los demás siguen funcionando. */
public class ModuloInactivoException extends RuntimeException {

    public ModuloInactivoException() {
        super("Esta función está en mantenimiento. Vuelve a intentarlo más tarde; lo demás de WEVEH sigue funcionando.");
    }
}
