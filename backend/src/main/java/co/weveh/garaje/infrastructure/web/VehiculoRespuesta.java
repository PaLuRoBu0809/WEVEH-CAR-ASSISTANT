package co.weveh.garaje.infrastructure.web;

import co.weveh.garaje.domain.Vehiculo;
import java.time.LocalDate;
import java.util.UUID;

record VehiculoRespuesta(UUID id, String tipo, Long catalogoLineaId, String alias, String marca, String linea,
                         Integer cilindradaCc, int anioModelo, String combustible, String transmision, String traccion,
                         String placa, LocalDate fechaMatricula, int kilometraje, String uso, int kmPromedioMes,
                         int versionFila) {

    static VehiculoRespuesta desde(Vehiculo v) {
        return new VehiculoRespuesta(v.id(), v.tipo().name(), v.catalogoLineaId(), v.alias(), v.marca(), v.linea(),
                v.cilindradaCc(), v.anioModelo(), v.combustible() == null ? null : v.combustible().name(),
                v.transmision() == null ? null : v.transmision().name(),
                v.traccion() == null ? null : v.traccion().codigo(), v.placa(), v.fechaMatricula(), v.km().valor(),
                v.uso().name(), v.kmPromedioMes(), v.versionFila());
    }
}
