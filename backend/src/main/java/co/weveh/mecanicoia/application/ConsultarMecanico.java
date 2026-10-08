package co.weveh.mecanicoia.application;

import co.weveh.mecanicoia.domain.Diagnostico;
import co.weveh.shared.domain.DispositivoId;
import java.util.UUID;

/**
 * RF-MIA-01 a RF-MIA-06: la persona describe un síntoma y recibe una orientación con el contexto de su vehículo.
 */
public interface ConsultarMecanico {

    int LARGO_MAXIMO_SINTOMA = 1_000;
    int CONSULTAS_POR_DIA = 30;

    Diagnostico consultar(DispositivoId dispositivo, UUID vehiculoId, String sintoma);
}
