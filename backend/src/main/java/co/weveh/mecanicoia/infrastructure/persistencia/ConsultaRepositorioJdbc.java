package co.weveh.mecanicoia.infrastructure.persistencia;

import co.weveh.mecanicoia.application.puertos.ConsultaRepositorio;
import co.weveh.mecanicoia.domain.Diagnostico;
import java.util.UUID;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Repository;
import tools.jackson.databind.json.JsonMapper;

@Repository
class ConsultaRepositorioJdbc implements ConsultaRepositorio {

    private final JdbcClient jdbc;
    private final JsonMapper json;

    ConsultaRepositorioJdbc(JdbcClient jdbc, JsonMapper json) {
        this.jdbc = jdbc;
        this.json = json;
    }

    @Override
    public void guardar(UUID id, UUID vehiculoId, String sintoma, Diagnostico diagnostico, String modelo, String versionPrompt) {
        jdbc.sql("""
                        insert into consulta_mecanico (id, vehiculo_id, sintoma, nivel_gravedad, diagnostico, respuesta_segura, modelo, version_prompt)
                        values (?, ?, ?, ?, cast(? as jsonb), ?, ?, ?)""")
                .params(id, vehiculoId, sintoma, diagnostico.nivelGravedad().name(), json.writeValueAsString(diagnostico),
                        diagnostico.seguro(), modelo, versionPrompt)
                .update();
    }

    @Override
    public int contarUltimoDia(UUID vehiculoId) {
        return jdbc.sql("select count(*) from consulta_mecanico where vehiculo_id = ? and creado_en > now() - interval '1 day'")
                .param(vehiculoId)
                .query(Integer.class)
                .single();
    }
}
