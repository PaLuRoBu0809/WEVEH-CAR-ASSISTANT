package co.weveh.cuentas.infrastructure.persistencia;

import java.time.Instant;
import java.util.UUID;
import org.springframework.data.annotation.Id;
import org.springframework.data.annotation.ReadOnlyProperty;
import org.springframework.data.relational.core.mapping.Table;

/** Fila de la tabla usuario (ADR 0006). El id es el de Supabase Auth. */
@Table("usuario")
record UsuarioFila(@Id UUID id, String nombre, @ReadOnlyProperty Instant creadoEn) {
}
