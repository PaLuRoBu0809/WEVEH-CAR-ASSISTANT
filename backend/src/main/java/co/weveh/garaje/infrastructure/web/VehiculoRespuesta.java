package co.weveh.garaje.infrastructure.web;

import co.weveh.garaje.domain.Vehiculo;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

/**
 * @param datosFaltantes lo que la persona dejó para después (SOAT, RTM, ACEITE), para recordárselo en Inicio
 */
record VehiculoRespuesta(UUID id, String tipo, Long catalogoLineaId, String alias, String marca, String linea,
                         Integer cilindradaCc, int anioModelo, String combustible, String transmision, String traccion,
                         String placa, LocalDate fechaMatricula, int kilometraje, String uso, int kmPromedioMes,
                         Integer aceiteKm, LocalDate aceiteFecha, LocalDate soatFecha, LocalDate rtmFecha,
                         boolean rtmAunNoAplica, LocalDate seguroInicio, String seguroEntidad,
                         List<String> datosFaltantes, int versionFila) {

    static VehiculoRespuesta desde(Vehiculo v) {
        var r = v.registroInicial();
        return new VehiculoRespuesta(v.id(), v.tipo().name(), v.catalogoLineaId(), v.alias(), v.marca(), v.linea(),
                v.cilindradaCc(), v.anioModelo(), v.combustible() == null ? null : v.combustible().name(),
                v.transmision() == null ? null : v.transmision().name(),
                v.traccion() == null ? null : v.traccion().codigo(), v.placa(), v.fechaMatricula(), v.km().valor(),
                v.uso().name(), v.kmPromedioMes(), r.aceiteKm(), r.aceiteFecha(), r.soatFecha(), r.rtmFecha(),
                r.rtmAunNoAplica(), r.seguroInicio(), r.seguroEntidad(),
                v.datosFaltantes().stream().map(Enum::name).toList(), v.versionFila());
    }
}
