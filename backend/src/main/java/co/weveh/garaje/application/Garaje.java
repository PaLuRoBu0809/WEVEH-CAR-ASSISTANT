package co.weveh.garaje.application;

import co.weveh.garaje.domain.UsoVehiculo;
import co.weveh.garaje.domain.Vehiculo;
import co.weveh.shared.domain.DispositivoId;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

/**
 * Casos de uso del garaje (RF-GAR-01 a RF-GAR-04). Todos filtran por dispositivo: un vehículo de otro dispositivo
 * responde como si no existiera.
 */
public interface Garaje {

    List<Vehiculo> listar(DispositivoId dispositivo);

    Vehiculo obtener(DispositivoId dispositivo, UUID vehiculoId);

    Vehiculo registrar(DispositivoId dispositivo, Vehiculo.DatosRegistro datos);

    Vehiculo editar(DispositivoId dispositivo, UUID vehiculoId, Edicion edicion);

    void eliminar(DispositivoId dispositivo, UUID vehiculoId);

    /** @param versionFila la versión que la app tenía al editar; si cambió entre tanto se responde conflicto */
    record Edicion(String alias, String placa, UsoVehiculo uso, int kmPromedioMes, LocalDate fechaMatricula,
                   int versionFila) {
    }
}
