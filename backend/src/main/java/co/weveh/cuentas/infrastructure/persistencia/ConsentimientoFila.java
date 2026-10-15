package co.weveh.cuentas.infrastructure.persistencia;

import java.time.Instant;
import java.util.UUID;
import org.springframework.data.annotation.Id;
import org.springframework.data.relational.core.mapping.Table;

/** Fila de la tabla consentimiento (ADR 0006, RF-DAT-02). */
@Table("consentimiento")
record ConsentimientoFila(@Id UUID id, UUID usuarioId, String versionPolitica, Instant aceptadoEn, String medio) {
}
