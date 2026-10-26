package co.weveh.mecanicoia.domain;

/**
 * Por qué la regla de seguridad marcó Crítico (RF-MIA-03). Decide el plazo (RF-MIA-08): las que comprometen frenar,
 * girar o el motor impiden seguir manejando; la batería no, pero hay que llevarlo hoy.
 */
public enum CausaCritica {
    FRENOS(true, "Posible problema en los frenos"),
    DIRECCION(true, "Posible problema en la dirección"),
    TESTIGO_ROJO(true, "Un testigo rojo encendido en el tablero"),
    TEMPERATURA(true, "Posible recalentamiento del motor"),
    ACEITE(true, "Posible problema con el aceite del motor"),
    HUMO(true, "Sale humo del vehículo"),
    BATERIA(false, "Posible problema en la batería o la carga");

    private final boolean impideManejar;
    private final String descripcion;

    CausaCritica(boolean impideManejar, String descripcion) {
        this.impideManejar = impideManejar;
        this.descripcion = descripcion;
    }

    public boolean impideManejar() {
        return impideManejar;
    }

    /** Para la tarjeta que crea el backend cuando el modelo no la mandó. */
    public String descripcion() {
        return descripcion;
    }
}
