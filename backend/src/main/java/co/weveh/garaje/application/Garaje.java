package co.weveh.garaje.application;

import co.weveh.garaje.domain.RegistroInicial;
import co.weveh.garaje.domain.UsoVehiculo;
import co.weveh.garaje.domain.Vehiculo;
import co.weveh.shared.domain.UsuarioId;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

/**
 * Casos de uso del garaje (RF-GAR-01 a RF-GAR-05). Todos filtran por usuario: un vehículo de otro usuario
 * responde como si no existiera.
 */
public interface Garaje {

    List<Vehiculo> listar(UsuarioId usuario);

    Vehiculo obtener(UsuarioId usuario, UUID vehiculoId);

    Vehiculo registrar(UsuarioId usuario, Vehiculo.DatosRegistro datos);

    Vehiculo editar(UsuarioId usuario, UUID vehiculoId, Edicion edicion);

    /**
     * RF-GAR-02b: agrega el aceite y los papeles que quedaron para después.
     *
     * @param versionFila la versión que la app tenía; si cambió entre tanto se responde conflicto
     */
    Vehiculo completarRegistro(UsuarioId usuario, UUID vehiculoId, RegistroInicial registro, int versionFila);

    void eliminar(UsuarioId usuario, UUID vehiculoId);

    /** @param versionFila la versión que la app tenía al editar; si cambió entre tanto se responde conflicto */
    record Edicion(String alias, String placa, UsoVehiculo uso, int kmPromedioMes, LocalDate fechaMatricula,
                   int versionFila) {
    }
}
