package co.weveh.mecanicoia.infrastructure.persistencia;

import java.time.Instant;
import java.util.UUID;
import org.springframework.data.annotation.Id;
import org.springframework.data.annotation.ReadOnlyProperty;
import org.springframework.data.relational.core.mapping.Table;

/**
 * Fila de la tabla consulta_mecanico (ADR 0006). El diagnóstico va como texto JSON; se escribe en la columna jsonb con
 * la consulta de inserción del repositorio.
 */
@Table("consulta_mecanico")
record ConsultaFila(
        @Id UUID id,
        UUID vehiculoId,
        String sintoma,
        String nivelGravedad,
        String diagnostico,
        boolean respuestaSegura,
        String modelo,
        String versionPrompt,
        @ReadOnlyProperty Instant creadoEn) {
}
