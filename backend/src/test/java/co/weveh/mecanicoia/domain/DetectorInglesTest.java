package co.weveh.mecanicoia.domain;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.NullAndEmptySource;
import org.junit.jupiter.params.provider.ValueSource;

/** RF-MIA-01: la respuesta se muestra solo si está en español. */
class DetectorInglesTest {

    @ParameterizedTest
    @NullAndEmptySource
    @ValueSource(strings = {
            "Pastillas de freno desgastadas",
            "El metal roza el disco y puede rayarlo. Si no se cambian, frenar cuesta más.",
            "Lleva tu Toyota Land Cruiser Prado al taller esta semana.",
            "Revisa el nivel del aceite del Spark con la varilla.",
            "Puede ser la correa de distribución o un tensor flojo."
    })
    void elEspanolPasa(String texto) {
        assertThat(DetectorIngles.tieneIngles(texto)).isFalse();
    }

    @ParameterizedTest
    @ValueSource(strings = {
            "No se proporcionó suficiente información sobre lo que está happening.",
            "Check the brakes as soon as possible",
            "Puede ser un issue de la batería",
            "Lleva el carro al taller, please"
    })
    void elInglesSeDetecta(String texto) {
        assertThat(DetectorIngles.tieneIngles(texto)).isTrue();
    }
}
