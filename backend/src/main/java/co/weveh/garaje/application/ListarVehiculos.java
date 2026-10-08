package co.weveh.garaje.application;

import co.weveh.shared.domain.DispositivoId;
import java.util.List;

/**
 * RF-GAR-01: vehículos del dispositivo.
 */
public interface ListarVehiculos {

    List<VehiculoResumen> ejecutar(DispositivoId dispositivo);
}
