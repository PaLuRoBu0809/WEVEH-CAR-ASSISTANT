package co.weveh.catalogo.infrastructure.persistencia;

import java.math.BigDecimal;
import org.springframework.data.annotation.Id;
import org.springframework.data.relational.core.mapping.Table;

/**
 * Fila de catalogo.linea con las columnas que usa la app (solo lectura, ADR 0006), más lo investigado y revisado de
 * catalogo.atributo_linea para cada atributo: valores separados por coma, origen y fuente (ADR 0021).
 */
@Table(schema = "catalogo", value = "linea")
record LineaFila(
        @Id long id,
        long marcaId,
        String nombre,
        String clase,
        String tipoVehiculo,
        Integer cilindradaCc,
        BigDecimal potenciaKw,
        String combustible,
        String transmision,
        String traccion,
        Integer puertas,
        String combustibleInvestigado,
        String combustibleOrigen,
        String combustibleFuente,
        String transmisionInvestigada,
        String transmisionOrigen,
        String transmisionFuente,
        String traccionInvestigada,
        String traccionOrigen,
        String traccionFuente) {
}
