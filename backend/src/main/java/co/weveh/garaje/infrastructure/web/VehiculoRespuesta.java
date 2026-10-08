package co.weveh.garaje.infrastructure.web;

import co.weveh.garaje.application.VehiculoResumen;
import java.util.UUID;

record VehiculoRespuesta(UUID id, String tipo, String alias, String marca, String linea, int anioModelo,
                         int kilometraje) {

    static VehiculoRespuesta desde(VehiculoResumen vehiculo) {
        return new VehiculoRespuesta(vehiculo.id(), vehiculo.tipo(), vehiculo.alias(), vehiculo.marca(),
                vehiculo.linea(), vehiculo.anioModelo(), vehiculo.kilometraje());
    }
}
