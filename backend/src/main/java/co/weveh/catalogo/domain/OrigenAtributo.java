package co.weveh.catalogo.domain;

/** De dónde sale un atributo de la línea (ADR 0021). */
public enum OrigenAtributo {
    /** Deducido del nombre o la clase que publica el Ministerio (capa 0). */
    CATALOGO,
    /** Investigado en la web por familia, con fuente y revisado (capa 1). */
    IA_WEB,
    /** Corregido por el equipo. */
    EQUIPO
}
