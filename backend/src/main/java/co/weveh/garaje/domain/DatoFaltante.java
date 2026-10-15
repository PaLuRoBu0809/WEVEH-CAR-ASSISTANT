package co.weveh.garaje.domain;

/**
 * Datos del registro básico que la persona dejó para después (RF-GAR-02b). La app los recuerda en Inicio y el Mecánico
 * IA sugiere completarlos (RF-MIA-05).
 */
public enum DatoFaltante {
    SOAT,
    /** Ni fecha de la última revisión técnico-mecánica ni "Aún no aplica". */
    RTM,
    /** No sabemos cuándo fue el último cambio de aceite. */
    ACEITE
}
