package co.weveh.garaje.domain;

final class Textos {

    private Textos() {
    }

    /** Quita espacios sobrantes; texto vacío pasa a null. */
    static String limpio(String texto) {
        if (texto == null) {
            return null;
        }
        var limpio = texto.strip().replaceAll("\\s+", " ");
        return limpio.isEmpty() ? null : limpio;
    }
}
