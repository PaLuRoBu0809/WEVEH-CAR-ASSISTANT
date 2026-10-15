package co.weveh.cuentas.application.puertos;

import co.weveh.cuentas.domain.Consentimiento;
import co.weveh.cuentas.domain.Usuario;
import co.weveh.shared.domain.UsuarioId;
import java.util.List;
import java.util.Optional;

public interface UsuarioRepositorio {

    Optional<Usuario> buscar(UsuarioId usuario);

    /** @return false si el perfil ya existía (no lo cambia) */
    boolean insertar(Usuario usuario);

    void actualizar(Usuario usuario);

    List<Consentimiento> consentimientos(UsuarioId usuario);

    void guardar(Consentimiento consentimiento);

    /** Borra el perfil; la base borra en cascada vehículos, consultas y consentimientos. */
    void eliminar(UsuarioId usuario);
}
