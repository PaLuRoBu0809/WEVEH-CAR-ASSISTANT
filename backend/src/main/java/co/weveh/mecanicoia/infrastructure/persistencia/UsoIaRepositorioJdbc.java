package co.weveh.mecanicoia.infrastructure.persistencia;

import co.weveh.mecanicoia.application.puertos.UsoIaRepositorio;
import co.weveh.shared.domain.UsuarioId;
import java.util.Map;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.stereotype.Repository;

/** Tabla uso_ia (V12): solo cuenta, nunca el texto ni el audio. */
@Repository
class UsoIaRepositorioJdbc implements UsoIaRepositorio {

    private final NamedParameterJdbcTemplate jdbc;

    UsoIaRepositorioJdbc(NamedParameterJdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    @Override
    public void registrar(UsuarioId usuario, Tipo tipo) {
        jdbc.update("insert into uso_ia (usuario_id, tipo) values (:usuario, :tipo)",
                Map.of("usuario", usuario.valor(), "tipo", tipo.name()));
    }

    @Override
    public int contarUltimoDia(UsuarioId usuario) {
        var cuantos = jdbc.queryForObject("""
                        select count(*) from uso_ia where usuario_id = :usuario and creado_en > now() - interval '1 day'""",
                Map.of("usuario", usuario.valor()), Integer.class);
        return cuantos == null ? 0 : cuantos;
    }
}
