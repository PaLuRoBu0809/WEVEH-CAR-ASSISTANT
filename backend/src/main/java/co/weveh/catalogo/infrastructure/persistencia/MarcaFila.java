package co.weveh.catalogo.infrastructure.persistencia;

import org.springframework.data.annotation.Id;
import org.springframework.data.relational.core.mapping.Table;

/** Fila de catalogo.marca (solo lectura, ADR 0006). */
@Table(schema = "catalogo", value = "marca")
record MarcaFila(@Id long id, String nombre, String tipo) {
}
