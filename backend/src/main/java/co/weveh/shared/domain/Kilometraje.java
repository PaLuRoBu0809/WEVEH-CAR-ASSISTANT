package co.weveh.shared.domain;

/**
 * Kilómetros del tablero: entre 0 y 2.000.000 (skill dominio-vehiculo §5).
 */
public record Kilometraje(int valor) {

    public static final int MAXIMO = 2_000_000;

    public Kilometraje {
        if (valor < 0) {
            throw new DatoInvalidoException("El kilometraje debe ser mayor o igual a cero");
        }
        if (valor > MAXIMO) {
            throw new DatoInvalidoException("El kilometraje no puede pasar de 2.000.000 km");
        }
    }
}
