package co.weveh.garaje;

import java.util.UUID;

/**
 * Evento público del módulo garaje: mantenimiento y documentos lo escuchan para crear el plan y los vencimientos.
 */
public record VehiculoRegistrado(UUID vehiculoId) {
}
