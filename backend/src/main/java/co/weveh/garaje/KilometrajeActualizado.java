package co.weveh.garaje;

import java.util.UUID;

/**
 * Evento público del módulo garaje (RF-GAR-05): mantenimiento lo escuchará para recalcular el plan (fase 2).
 */
public record KilometrajeActualizado(UUID vehiculoId, int kilometraje) {
}
