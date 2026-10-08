package co.weveh.catalogo.domain;

/**
 * Marca de las tablas del Ministerio de Transporte. tipo: CARRO, MOTO o AMBOS.
 */
public record MarcaCatalogo(long id, String nombre, String tipo) {
}
