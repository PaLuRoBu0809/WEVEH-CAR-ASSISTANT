package co.weveh.mecanicoia.domain;

/**
 * RF-MIA-08: "¿Puedo seguir manejando?" y "¿Cuándo debo llevarlo?" los responde el código, nunca el modelo. Ordenados
 * de menos a más urgente; vectores en contracts/vectores-plazo.json.
 */
public enum Plazo {
    PROXIMO_SERVICIO("Puedes manejar; revísalo en tu próximo servicio"),
    ESTA_SEMANA("Puedes manejar con cuidado; llévalo esta semana"),
    HOY("Llévalo hoy al mecánico"),
    NO_MANEJAR("No manejes; llévalo hoy al mecánico");

    private final String texto;

    Plazo(String texto) {
        this.texto = texto;
    }

    public String texto() {
        return texto;
    }

    /**
     * @param causa        la de la regla de seguridad, o null si no se disparó
     * @param piezaVencida la pieza relacionada está VENCIDO o SIN_DATO_REVISAR_YA: sube un nivel (tope NO_MANEJAR)
     */
    public static Plazo calcular(NivelGravedad nivel, CausaCritica causa, boolean piezaVencida) {
        var base = switch (nivel) {
            case LEVE -> PROXIMO_SERVICIO;
            case MODERADO -> ESTA_SEMANA;
            case CRITICO -> causa != null && causa.impideManejar() ? NO_MANEJAR : HOY;
        };
        return piezaVencida ? base.subir() : base;
    }

    private Plazo subir() {
        return this == NO_MANEJAR ? NO_MANEJAR : values()[ordinal() + 1];
    }
}
