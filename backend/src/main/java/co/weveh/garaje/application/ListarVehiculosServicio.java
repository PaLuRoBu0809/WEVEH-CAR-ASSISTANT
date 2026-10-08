package co.weveh.garaje.application;

import co.weveh.garaje.application.puertos.VehiculoRepositorio;
import co.weveh.shared.domain.DispositivoId;
import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional(readOnly = true)
class ListarVehiculosServicio implements ListarVehiculos {

    private final VehiculoRepositorio repositorio;

    ListarVehiculosServicio(VehiculoRepositorio repositorio) {
        this.repositorio = repositorio;
    }

    @Override
    public List<VehiculoResumen> ejecutar(DispositivoId dispositivo) {
        return repositorio.buscarPorDispositivo(dispositivo);
    }
}
