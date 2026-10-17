package co.weveh.cuentas.domain;

/** Por dónde aceptó la persona la política de tratamiento de datos (RF-DAT-02). */
public enum MedioConsentimiento {
    /** Casilla al crear la cuenta (RF-DAT-01). */
    APP_REGISTRO,
    /** Aceptó una versión nueva de la política al entrar (RF-DAT-03). */
    APP_NUEVA_VERSION
}
