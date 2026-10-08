package co.weveh.garaje;

import co.weveh.shared.domain.DispositivoId;
import java.time.LocalDate;
import java.util.Optional;
import java.util.UUID;

/**
 * Fachada pública del garaje: lo único que otros módulos usan para leer un vehículo (skill arquitectura).
 */
public interface GarajeApi {

    /** Vacío si el vehículo no existe o es de otro dispositivo. */
    Optional<DatosVehiculo> buscar(DispositivoId dispositivo, UUID vehiculoId);

    /**
     * Lo que otros módulos necesitan del vehículo. Sin placa ni alias: estos datos pueden ir a un modelo de IA
     * (CLAUDE.md, reglas de IA 7).
     */
    record DatosVehiculo(
            UUID id,
            String tipo,
            String marca,
            String linea,
            Integer cilindradaCc,
            int anioModelo,
            String combustible,
            String transmision,
            String traccion,
            int km,
            String uso,
            int kmPromedioMes,
            Integer aceiteKm,
            LocalDate aceiteFecha,
            LocalDate soatFecha,
            LocalDate rtmFecha,
            boolean rtmAunNoAplica) {
    }
}
