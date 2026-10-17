package co.weveh.mecanicoia.infrastructure.persistencia;

import co.weveh.mecanicoia.application.puertos.ConsultaRepositorio;
import co.weveh.mecanicoia.domain.Diagnostico;
import java.util.UUID;
import org.springframework.stereotype.Repository;
import tools.jackson.databind.json.JsonMapper;

/**
 * Adaptador de la tabla consulta_mecanico con Spring Data JDBC (ADR 0006).
 */
@Repository
class ConsultaRepositorioSpringData implements ConsultaRepositorio {

    private final ConsultaFilaRepositorio filas;
    private final JsonMapper json;

    ConsultaRepositorioSpringData(ConsultaFilaRepositorio filas, JsonMapper json) {
        this.filas = filas;
        this.json = json;
    }

    @Override
    public void guardar(UUID id, UUID vehiculoId, String sintoma, Diagnostico diagnostico, String modelo, String versionPrompt) {
        filas.insertar(id, vehiculoId, sintoma, diagnostico.nivelGravedad().name(), json.writeValueAsString(diagnostico),
                diagnostico.seguro(), modelo, versionPrompt);
    }

    @Override
    public int contarUltimoDia(UUID vehiculoId) {
        return filas.contarUltimoDia(vehiculoId);
    }
}
