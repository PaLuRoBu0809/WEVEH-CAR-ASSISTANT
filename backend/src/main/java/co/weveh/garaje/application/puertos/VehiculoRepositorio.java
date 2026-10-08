package co.weveh.garaje.application.puertos;

import co.weveh.garaje.application.VehiculoResumen;
import co.weveh.shared.domain.DispositivoId;
import java.util.List;

public interface VehiculoRepositorio {

    List<VehiculoResumen> buscarPorDispositivo(DispositivoId dispositivo);
}
