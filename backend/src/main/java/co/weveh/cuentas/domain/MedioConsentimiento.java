package co.weveh.cuentas.domain;

/** Por dónde aceptó la persona la política de tratamiento de datos (RF-DAT-02). */
public enum MedioConsentimiento {
    /** Casilla al crear la cuenta con correo (RF-DAT-01). */
    APP_REGISTRO,
    /** Aceptó una versión nueva de la política al entrar (RF-DAT-03). */
    APP_NUEVA_VERSION,
    /** Casilla de la pantalla "Antes de entrar" la primera vez que entra con Google (RF-CTA-02, RF-DAT-01). */
    APP_GOOGLE;

    /** Los medios con los que se puede crear la cuenta; una versión nueva solo se acepta con la cuenta ya creada. */
    public boolean sirveParaCrearCuenta() {
        return this != APP_NUEVA_VERSION;
    }
}
