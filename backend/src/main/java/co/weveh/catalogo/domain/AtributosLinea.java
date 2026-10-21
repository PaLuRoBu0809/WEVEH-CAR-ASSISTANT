package co.weveh.catalogo.domain;

/** Combustible, transmisión y tracción resueltos de una línea; cada uno null cuando no hay dato (RF-CAT-04). */
public record AtributosLinea(AtributoLinea combustible, AtributoLinea transmision, AtributoLinea traccion) {
}
