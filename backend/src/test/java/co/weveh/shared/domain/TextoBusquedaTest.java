package co.weveh.shared.domain;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;

class TextoBusquedaTest {

    @Test
    void quitaTildesMayusculasYEspacios() {
        assertThat(TextoBusqueda.de("  Citroën   PRADO  vx ").palabras()).containsExactly("citroen", "prado", "vx");
    }

    @Test
    void enieSeVuelveN() {
        assertThat(TextoBusqueda.normalizar("Ñandú")).isEqualTo("nandu");
    }

    @Test
    void vacioONuloNoTienePalabras() {
        assertThat(TextoBusqueda.de(null).estaVacio()).isTrue();
        assertThat(TextoBusqueda.de("   ").estaVacio()).isTrue();
    }

    @Test
    void limitaLaCantidadDePalabras() {
        assertThat(TextoBusqueda.de("a b c d e f g h").palabras()).hasSize(6);
    }
}
