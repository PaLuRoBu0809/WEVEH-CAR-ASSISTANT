package co.weveh.garaje.infrastructure.web;

import co.weveh.garaje.application.Garaje;
import co.weveh.garaje.domain.Combustible;
import co.weveh.garaje.domain.RegistroInicial;
import co.weveh.garaje.domain.Traccion;
import co.weveh.garaje.domain.Transmision;
import co.weveh.garaje.domain.UsoVehiculo;
import co.weveh.garaje.domain.Vehiculo;
import co.weveh.shared.domain.TipoVehiculo;
import co.weveh.shared.domain.UsuarioId;
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
    List<VehiculoRespuesta> listar(UsuarioId usuario) {
        return garaje.listar(usuario).stream().map(VehiculoRespuesta::desde).toList();
    }

    @GetMapping("/{id}")
    VehiculoRespuesta obtener(UsuarioId usuario, @PathVariable UUID id) {
        return VehiculoRespuesta.desde(garaje.obtener(usuario, id));
    }

    @PostMapping
    ResponseEntity<VehiculoRespuesta> registrar(UsuarioId usuario, @Valid @RequestBody RegistroSolicitud solicitud) {
        var vehiculo = garaje.registrar(usuario, solicitud.aDatos());
        return ResponseEntity.created(URI.create("/api/v1/vehiculos/" + vehiculo.id()))
                .body(VehiculoRespuesta.desde(vehiculo));
    }

    @PutMapping("/{id}")
    VehiculoRespuesta editar(UsuarioId usuario, @PathVariable UUID id, @Valid @RequestBody EdicionSolicitud solicitud) {
        return VehiculoRespuesta.desde(garaje.editar(usuario, id,
                new Garaje.Edicion(solicitud.aDatos(), solicitud.versionFila())));
    }

    @PutMapping("/{id}/registro")
    VehiculoRespuesta completarRegistro(UsuarioId usuario, @PathVariable UUID id,
                                        @Valid @RequestBody CompletarRegistroSolicitud solicitud) {
        return VehiculoRespuesta.desde(garaje.completarRegistro(usuario, id, solicitud.aRegistro(), solicitud.versionFila()));
    }

    @PutMapping("/{id}/kilometraje")
    VehiculoRespuesta actualizarKilometraje(UsuarioId usuario, @PathVariable UUID id,
                                            @Valid @RequestBody KilometrajeSolicitud solicitud) {
        return VehiculoRespuesta.desde(garaje.actualizarKilometraje(usuario, id, solicitud.kilometraje(),
                Boolean.TRUE.equals(solicitud.confirmado()), solicitud.leidoEn()));
    }

    /** ADR 0023: "Me equivoqué al anotarlo". */
    @PutMapping("/{id}/kilometraje/correccion")
    VehiculoRespuesta corregirKilometraje(UsuarioId usuario, @PathVariable UUID id,
                                          @Valid @RequestBody CorreccionKilometrajeSolicitud solicitud) {
        return VehiculoRespuesta.desde(garaje.corregirKilometraje(usuario, id, solicitud.kilometraje()));
    }

    @DeleteMapping("/{id}")
    ResponseEntity<Void> eliminar(UsuarioId usuario, @PathVariable UUID id) {
        garaje.eliminar(usuario, id);
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

    /** RF-GAR-03: combustible, transmisión y tracción son opcionales; si no llegan se conservan los actuales. */
    record EdicionSolicitud(String alias, String placa, @NotNull UsoVehiculo uso, @NotNull Integer kmPromedioMes,
                            LocalDate fechaMatricula, Combustible combustible, Transmision transmision,
                            String traccion, @NotNull Integer versionFila) {

        Vehiculo.DatosEdicion aDatos() {
            return new Vehiculo.DatosEdicion(alias, placa, uso, kmPromedioMes, fechaMatricula, combustible,
                    transmision, Traccion.desdeCodigo(traccion));
        }
    }

    /**
     * @param confirmado true cuando la persona ya confirmó un salto raro (respuesta 409 confirmacion-requerida)
     * @param leidoEn    día en que se anotó sin red (RF-GAR-06); si falta, hoy
     */
    record KilometrajeSolicitud(@NotNull Integer kilometraje, Boolean confirmado, LocalDate leidoEn) {
    }

    record CorreccionKilometrajeSolicitud(@NotNull Integer kilometraje) {
    }

    /** RF-GAR-02b: el aceite y los papeles completos como quedan (lo que siga vacío queda para después). */
    record CompletarRegistroSolicitud(Integer aceiteKm, LocalDate aceiteFecha, LocalDate soatFecha, LocalDate rtmFecha,
                                      Boolean rtmAunNoAplica, LocalDate seguroInicio, String seguroEntidad,
                                      @NotNull Integer versionFila) {

        RegistroInicial aRegistro() {
            return new RegistroInicial(aceiteKm, aceiteFecha, soatFecha, rtmFecha, Boolean.TRUE.equals(rtmAunNoAplica),
                    seguroInicio, seguroEntidad);
        }
    }
}
