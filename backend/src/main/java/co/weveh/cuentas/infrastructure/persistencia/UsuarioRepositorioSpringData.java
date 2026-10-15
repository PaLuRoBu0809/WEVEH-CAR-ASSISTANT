package co.weveh.cuentas.infrastructure.persistencia;

import co.weveh.cuentas.application.puertos.UsuarioRepositorio;
import co.weveh.cuentas.domain.Consentimiento;
import co.weveh.cuentas.domain.MedioConsentimiento;
import co.weveh.cuentas.domain.Usuario;
import co.weveh.shared.domain.UsuarioId;
import java.util.List;
import java.util.Optional;
import org.springframework.stereotype.Repository;

/**
 * Adaptador de las tablas usuario y consentimiento con Spring Data JDBC (ADR 0006).
 */
@Repository
class UsuarioRepositorioSpringData implements UsuarioRepositorio {

    private final UsuarioFilaRepositorio usuarios;
    private final ConsentimientoFilaRepositorio consentimientos;

    UsuarioRepositorioSpringData(UsuarioFilaRepositorio usuarios, ConsentimientoFilaRepositorio consentimientos) {
        this.usuarios = usuarios;
        this.consentimientos = consentimientos;
    }

    @Override
    public Optional<Usuario> buscar(UsuarioId usuario) {
        return usuarios.findById(usuario.valor()).map(fila -> new Usuario(new UsuarioId(fila.id()), fila.nombre()));
    }

    @Override
    public boolean insertar(Usuario usuario) {
        return usuarios.insertarSiNoExiste(usuario.id().valor(), usuario.nombre()) == 1;
    }

    @Override
    public void actualizar(Usuario usuario) {
        usuarios.cambiarNombre(usuario.id().valor(), usuario.nombre());
    }

    @Override
    public List<Consentimiento> consentimientos(UsuarioId usuario) {
        return consentimientos.findByUsuarioIdOrderByAceptadoEn(usuario.valor()).stream()
                .map(fila -> new Consentimiento(fila.id(), usuario, fila.versionPolitica(), fila.aceptadoEn(),
                        MedioConsentimiento.valueOf(fila.medio())))
                .toList();
    }

    @Override
    public void guardar(Consentimiento consentimiento) {
        consentimientos.insertar(consentimiento.id(), consentimiento.usuario().valor(), consentimiento.versionPolitica(),
                consentimiento.aceptadoEn(), consentimiento.medio().name());
    }

    @Override
    public void eliminar(UsuarioId usuario) {
        usuarios.eliminar(usuario.valor());
    }
}
