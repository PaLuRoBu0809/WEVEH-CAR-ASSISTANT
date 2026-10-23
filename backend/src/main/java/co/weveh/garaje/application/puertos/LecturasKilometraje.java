package co.weveh.garaje.application.puertos;

import java.time.LocalDate;
import java.util.OptionalInt;
import java.util.UUID;

/** Historial de lecturas del kilometraje (ADR 0023): de ahí sale hasta dónde se puede corregir la última. */
public interface LecturasKilometraje {

    void anotar(UUID vehiculoId, int km, LocalDate leidoEn);

    /** El kilometraje de la lectura anterior a la última; vacío si la última es la primera. */
    OptionalInt anteriorALaUltima(UUID vehiculoId);

    /** Reemplaza el valor de la última lectura y la marca como corregida. */
    void corregirUltima(UUID vehiculoId, int km);
}
