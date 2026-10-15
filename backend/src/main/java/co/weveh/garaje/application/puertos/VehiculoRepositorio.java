package co.weveh.garaje.application.puertos;

import co.weveh.garaje.domain.Vehiculo;
import co.weveh.shared.domain.UsuarioId;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface VehiculoRepositorio {

    List<Vehiculo> buscarPorUsuario(UsuarioId usuario);

    Optional<Vehiculo> buscar(UsuarioId usuario, UUID vehiculoId);

    void insertar(Vehiculo vehiculo);

    /** @return false si la versión guardada ya no es la del vehículo (otra edición ganó) */
    boolean actualizar(Vehiculo vehiculo);

    /** @return false si no existía para ese usuario */
    boolean eliminar(UsuarioId usuario, UUID vehiculoId);
}
