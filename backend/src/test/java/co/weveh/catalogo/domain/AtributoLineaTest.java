package co.weveh.catalogo.domain;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.List;
import org.junit.jupiter.api.Test;

/** RF-CAT-04 y ADR 0021: de dónde sale cada atributo de la línea. */
class AtributoLineaTest {

    @Test
    void loQueDiceElNombreGanaSobreLoInvestigado() {
        var atributo = AtributoLinea.resolver("AUTOMATICA", "MECANICA", "IA_WEB", "https://toyota.com.co/prado");

        assertThat(atributo.valores()).containsExactly("AUTOMATICA");
        assertThat(atributo.origen()).isEqualTo(OrigenAtributo.CATALOGO);
        assertThat(atributo.fuente()).isNull();
    }

    @Test
    void sinDatoEnElNombreUsaLoInvestigadoConSuFuente() {
        var atributo = AtributoLinea.resolver(null, "4X2,4X4", "IA_WEB", "https://toyota.com.co/prado");

        assertThat(atributo.valores()).isEqualTo(List.of("4X2", "4X4"));
        assertThat(atributo.origen()).isEqualTo(OrigenAtributo.IA_WEB);
        assertThat(atributo.fuente()).isEqualTo("https://toyota.com.co/prado");
    }

    @Test
    void sinNingunDatoEsNullYLaAppPregunta() {
        assertThat(AtributoLinea.resolver(null, null, null, null)).isNull();
        assertThat(AtributoLinea.resolver(null, " ", "IA_WEB", "https://x.co")).isNull();
    }
}
