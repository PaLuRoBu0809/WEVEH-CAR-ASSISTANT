package co.weveh.garaje.application;

import co.weveh.garaje.domain.RegistroInicial;
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

    /**
     * RF-GAR-05: anota el kilometraje actual. Nunca baja; un salto raro exige {@code confirmado}.
     *
     * @param leidoEn día en que se anotó, cuando se anotó sin red (RF-GAR-06); null es hoy. Si ya hay una lectura
     *                más nueva o mayor, la de este cambio se descarta y se devuelve el vehículo como está (ADR 0009)
     */
    Vehiculo actualizarKilometraje(UsuarioId usuario, UUID vehiculoId, int kilometraje, boolean confirmado,
                                   LocalDate leidoEn);

    /**
     * ADR 0023: corrige hacia abajo la última lectura, solo en sus primeros 7 días y sin quedar por debajo de la
     * lectura anterior. Para subir el kilometraje se usa actualizarKilometraje.
     */
    Vehiculo corregirKilometraje(UsuarioId usuario, UUID vehiculoId, int kilometraje);

    void eliminar(UsuarioId usuario, UUID vehiculoId);

    /** @param versionFila la versión que la app tenía al editar; si cambió entre tanto se responde conflicto */
    record Edicion(Vehiculo.DatosEdicion datos, int versionFila) {
    }
}
