package co.weveh.mecanicoia.application.puertos;

import co.weveh.mecanicoia.domain.Diagnostico;
import java.util.UUID;

/**
 * RF-MIA-06: cada consulta queda con el síntoma, el diagnóstico, el modelo y la versión del prompt.
 */
public interface ConsultaRepositorio {

    void guardar(UUID id, UUID vehiculoId, String sintoma, Diagnostico diagnostico, String modelo, String versionPrompt);

    /** Consultas del vehículo en las últimas 24 horas, para limitar el costo. */
    int contarUltimoDia(UUID vehiculoId);
}
