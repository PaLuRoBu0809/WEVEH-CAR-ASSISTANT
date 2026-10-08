package co.weveh.garaje.infrastructure.web;

import co.weveh.garaje.application.ListarVehiculos;
import co.weveh.shared.domain.DispositivoId;
import java.util.List;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/vehiculos")
class VehiculoController {

    private final ListarVehiculos listarVehiculos;

    VehiculoController(ListarVehiculos listarVehiculos) {
        this.listarVehiculos = listarVehiculos;
    }

    @GetMapping
    List<VehiculoRespuesta> listar(DispositivoId dispositivo) {
        return listarVehiculos.ejecutar(dispositivo).stream().map(VehiculoRespuesta::desde).toList();
    }
}
