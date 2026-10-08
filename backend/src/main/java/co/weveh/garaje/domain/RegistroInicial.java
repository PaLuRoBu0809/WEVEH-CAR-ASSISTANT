package co.weveh.garaje.domain;

import co.weveh.shared.domain.DatoInvalidoException;
import java.time.LocalDate;

/**
 * Lo que la persona cuenta en el registro básico sobre el último cambio de aceite y sus papeles (skill
 * dominio-vehiculo §1, pasos 3 y 4). Mantenimiento y documentos lo convierten en plan y vencimientos (fase 2).
 *
 * @param aceiteKm         km del último cambio de aceite; null si respondió "No sé"
 * @param aceiteFecha      fecha del último cambio de aceite; null si respondió "No sé"
 * @param rtmFecha         fecha de la última revisión técnico-mecánica; null si aún no aplica
 * @param rtmAunNoAplica   el vehículo es nuevo y todavía no le toca la primera RTM
 */
public record RegistroInicial(
        Integer aceiteKm,
        LocalDate aceiteFecha,
        LocalDate soatFecha,
        LocalDate rtmFecha,
        boolean rtmAunNoAplica,
        LocalDate seguroInicio,
        String seguroEntidad) {

    public RegistroInicial {
        seguroEntidad = Textos.limpio(seguroEntidad);
    }

    void validar(int kmActual, LocalDate hoy) {
        if ((aceiteKm == null) != (aceiteFecha == null)) {
            throw new DatoInvalidoException("Del último cambio de aceite necesitamos el kilometraje y la fecha, o marca \"No sé\"");
        }
        if (aceiteKm != null && (aceiteKm < 0 || aceiteKm > kmActual)) {
            throw new DatoInvalidoException("El cambio de aceite no puede tener más kilómetros que el vehículo hoy");
        }
        if (soatFecha == null) {
            throw new DatoInvalidoException("Falta la fecha en que sacaste el SOAT");
        }
        if (rtmFecha == null && !rtmAunNoAplica) {
            throw new DatoInvalidoException("Falta la fecha de la última revisión técnico-mecánica, o marca \"Aún no aplica\"");
        }
        if (rtmFecha != null && rtmAunNoAplica) {
            throw new DatoInvalidoException("Si la revisión técnico-mecánica aún no aplica, no pongas fecha");
        }
        if (seguroEntidad != null && seguroInicio == null) {
            throw new DatoInvalidoException("Falta la fecha de inicio del seguro todo riesgo");
        }
        noEsFutura(aceiteFecha, hoy, "El último cambio de aceite no puede ser una fecha futura");
        noEsFutura(soatFecha, hoy, "La fecha del SOAT no puede ser futura");
        noEsFutura(rtmFecha, hoy, "La fecha de la revisión técnico-mecánica no puede ser futura");
        noEsFutura(seguroInicio, hoy, "El inicio del seguro no puede ser una fecha futura");
    }

    private static void noEsFutura(LocalDate fecha, LocalDate hoy, String mensaje) {
        if (fecha != null && fecha.isAfter(hoy)) {
            throw new DatoInvalidoException(mensaje);
        }
    }
}
