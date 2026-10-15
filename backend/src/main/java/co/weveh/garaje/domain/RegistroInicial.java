package co.weveh.garaje.domain;

import co.weveh.shared.domain.DatoInvalidoException;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

/**
 * Lo que la persona cuenta sobre el último cambio de aceite y sus papeles (skill dominio-vehiculo §1, pasos 3 y 4).
 * Todo es opcional al registrar (RF-GAR-02): lo que falte se recuerda después (RF-GAR-02b). Mantenimiento y documentos
 * lo convierten en plan y vencimientos (fase 2).
 *
 * @param aceiteKm         km del último cambio de aceite; null si no lo sabe o lo deja para después
 * @param aceiteFecha      fecha del último cambio de aceite; null si no lo sabe o lo deja para después
 * @param soatFecha        fecha en que sacó el SOAT; null si lo deja para después
 * @param rtmFecha         fecha de la última revisión técnico-mecánica; null si aún no aplica o lo deja para después
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

    /** Registro sin datos de aceite ni papeles: todo queda para después. */
    public static final RegistroInicial VACIO = new RegistroInicial(null, null, null, null, false, null, null);

    public RegistroInicial {
        seguroEntidad = Textos.limpio(seguroEntidad);
    }

    /** Lo que falta para cuidar bien el vehículo, en orden de importancia. El seguro todo riesgo es opcional. */
    public List<DatoFaltante> datosFaltantes() {
        var faltan = new ArrayList<DatoFaltante>();
        if (soatFecha == null) {
            faltan.add(DatoFaltante.SOAT);
        }
        if (rtmFecha == null && !rtmAunNoAplica) {
            faltan.add(DatoFaltante.RTM);
        }
        if (aceiteKm == null) {
            faltan.add(DatoFaltante.ACEITE);
        }
        return List.copyOf(faltan);
    }

    void validar(int kmActual, LocalDate hoy) {
        if ((aceiteKm == null) != (aceiteFecha == null)) {
            throw new DatoInvalidoException("Del último cambio de aceite necesitamos el kilometraje y la fecha, o marca \"No sé\"");
        }
        if (aceiteKm != null && (aceiteKm < 0 || aceiteKm > kmActual)) {
            throw new DatoInvalidoException("El cambio de aceite no puede tener más kilómetros que el vehículo hoy");
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
