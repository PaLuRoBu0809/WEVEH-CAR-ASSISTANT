package co.weveh.garaje.application;

import java.util.UUID;

/**
 * Vista de un vehículo en el garaje. Se completa en la fase 1 (RF-GAR-02).
 */
public record VehiculoResumen(UUID id, String tipo, String alias, String marca, String linea, int anioModelo,
                              int kilometraje) {
}
