package co.weveh.garaje.infrastructure.persistencia;

import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;
import org.springframework.data.annotation.Id;
import org.springframework.data.annotation.ReadOnlyProperty;
import org.springframework.data.annotation.Version;
import org.springframework.data.relational.core.mapping.Embedded;
import org.springframework.data.relational.core.mapping.Table;

/**
 * Fila de la tabla vehiculo (ADR 0006). Es solo persistencia: el dominio es Vehiculo. La versión es Integer para que
 * Spring Data distinga una fila nueva (null) de una existente con versión 0.
 */
@Table("vehiculo")
record VehiculoFila(
        @Id UUID id,
        UUID dispositivoId,
        String tipo,
        Long catalogoLineaId,
        String marca,
        String linea,
        Integer cilindradaCc,
        int anioModelo,
        String combustible,
        String transmision,
        String traccion,
        String alias,
        String placa,
        LocalDate fechaMatricula,
        int km,
        String uso,
        int kmPromedioMes,
        @Embedded.Nullable(prefix = "registro_") RegistroFila registro,
        @Version Integer versionFila,
        @ReadOnlyProperty Instant creadoEn) {

    record RegistroFila(
            Integer aceiteKm,
            LocalDate aceiteFecha,
            LocalDate soatFecha,
            LocalDate rtmFecha,
            boolean rtmAunNoAplica,
            LocalDate seguroInicio,
            String seguroEntidad) {
    }
}
