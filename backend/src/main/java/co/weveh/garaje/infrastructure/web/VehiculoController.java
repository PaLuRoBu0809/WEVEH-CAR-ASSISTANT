package co.weveh.garaje.infrastructure.web;

import co.weveh.garaje.application.Garaje;
import co.weveh.garaje.domain.Combustible;
import co.weveh.garaje.domain.RegistroInicial;
import co.weveh.garaje.domain.Traccion;
import co.weveh.garaje.domain.Transmision;
import co.weveh.garaje.domain.UsoVehiculo;
import co.weveh.garaje.domain.Vehiculo;
import co.weveh.shared.domain.DispositivoId;
import co.weveh.shared.domain.TipoVehiculo;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import java.net.URI;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/vehiculos")
class VehiculoController {

    private final Garaje garaje;

    VehiculoController(Garaje garaje) {
        this.garaje = garaje;
    }

    @GetMapping
    List<VehiculoRespuesta> listar(DispositivoId dispositivo) {
        return garaje.listar(dispositivo).stream().map(VehiculoRespuesta::desde).toList();
    }

    @GetMapping("/{id}")
    VehiculoRespuesta obtener(DispositivoId dispositivo, @PathVariable UUID id) {
        return VehiculoRespuesta.desde(garaje.obtener(dispositivo, id));
    }

    @PostMapping
    ResponseEntity<VehiculoRespuesta> registrar(DispositivoId dispositivo, @Valid @RequestBody RegistroSolicitud solicitud) {
        var vehiculo = garaje.registrar(dispositivo, solicitud.aDatos());
        return ResponseEntity.created(URI.create("/api/v1/vehiculos/" + vehiculo.id()))
                .body(VehiculoRespuesta.desde(vehiculo));
    }

    @PutMapping("/{id}")
    VehiculoRespuesta editar(DispositivoId dispositivo, @PathVariable UUID id, @Valid @RequestBody EdicionSolicitud solicitud) {
        var edicion = new Garaje.Edicion(solicitud.alias(), solicitud.placa(), solicitud.uso(),
                solicitud.kmPromedioMes(), solicitud.fechaMatricula(), solicitud.versionFila());
        return VehiculoRespuesta.desde(garaje.editar(dispositivo, id, edicion));
    }

    @DeleteMapping("/{id}")
    ResponseEntity<Void> eliminar(DispositivoId dispositivo, @PathVariable UUID id) {
        garaje.eliminar(dispositivo, id);
        return ResponseEntity.noContent().build();
    }

    record RegistroSolicitud(
            @NotNull TipoVehiculo tipo, Long catalogoLineaId, String marca, String linea, Integer cilindradaCc,
            @NotNull Integer anioModelo, Combustible combustible, Transmision transmision, String traccion,
            String alias, String placa, LocalDate fechaMatricula, @NotNull Integer kilometraje, UsoVehiculo uso,
            Integer kmPromedioMes, Integer aceiteKm, LocalDate aceiteFecha, LocalDate soatFecha, LocalDate rtmFecha,
            Boolean rtmAunNoAplica, LocalDate seguroInicio, String seguroEntidad) {

        Vehiculo.DatosRegistro aDatos() {
            var registro = new RegistroInicial(aceiteKm, aceiteFecha, soatFecha, rtmFecha, Boolean.TRUE.equals(rtmAunNoAplica),
                    seguroInicio, seguroEntidad);
            return new Vehiculo.DatosRegistro(tipo, catalogoLineaId, marca, linea, cilindradaCc, anioModelo,
                    combustible, transmision, Traccion.desdeCodigo(traccion), alias, placa, fechaMatricula,
                    kilometraje, uso, kmPromedioMes, registro);
        }
    }

    record EdicionSolicitud(String alias, String placa, @NotNull UsoVehiculo uso, @NotNull Integer kmPromedioMes,
                            LocalDate fechaMatricula, @NotNull Integer versionFila) {
    }
}
