package co.weveh.garaje.application.puertos;

import co.weveh.garaje.domain.Vehiculo;
import co.weveh.shared.domain.DispositivoId;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface VehiculoRepositorio {

    List<Vehiculo> buscarPorDispositivo(DispositivoId dispositivo);

    Optional<Vehiculo> buscar(DispositivoId dispositivo, UUID vehiculoId);

    void insertar(Vehiculo vehiculo);

    /** @return false si la versión guardada ya no es la del vehículo (otra edición ganó) */
    boolean actualizar(Vehiculo vehiculo);

    /** @return false si no existía para ese dispositivo */
    boolean eliminar(DispositivoId dispositivo, UUID vehiculoId);
}
