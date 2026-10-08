package co.weveh.garaje.infrastructure.persistencia;

import co.weveh.garaje.application.VehiculoResumen;
import co.weveh.garaje.application.puertos.VehiculoRepositorio;
import co.weveh.shared.domain.DispositivoId;
import java.util.List;
import org.springframework.stereotype.Repository;

/**
 * Adaptador de la fase 0: la tabla vehiculo llega en la fase 1 (RF-GAR-02) y reemplaza esta clase por el adaptador JPA.
 */
@Repository
class VehiculoRepositorioSinTabla implements VehiculoRepositorio {

    @Override
    public List<VehiculoResumen> buscarPorDispositivo(DispositivoId dispositivo) {
        return List.of();
    }
}
