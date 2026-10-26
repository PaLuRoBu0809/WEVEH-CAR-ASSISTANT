package co.weveh.mecanicoia.domain;

import static org.assertj.core.api.Assertions.assertThat;

import java.io.IOException;
import java.nio.file.Path;
import java.util.stream.Stream;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.Arguments;
import org.junit.jupiter.params.provider.MethodSource;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.json.JsonMapper;

/** RF-MIA-08 con los vectores compartidos con la app (contracts/vectores-plazo.json). */
class PlazoTest {

    static Stream<Arguments> vectores() throws IOException {
        var raiz = JsonMapper.builder().build().readTree(Path.of("..", "contracts", "vectores-plazo.json").toFile());
        return raiz.get("vectores").valueStream().map(v -> Arguments.of(v.get("caso").asString(), v));
    }

    @ParameterizedTest(name = "{0}")
    @MethodSource("vectores")
    void calculaElPlazoDelVector(String caso, JsonNode vector) {
        var entrada = vector.get("entrada");
        var causa = entrada.get("causa").isNull() ? null : CausaCritica.valueOf(entrada.get("causa").asString());

        var plazo = Plazo.calcular(NivelGravedad.valueOf(entrada.get("gravedad").asString()), causa,
                entrada.get("piezaVencida").asBoolean());

        assertThat(plazo).as(caso).isEqualTo(Plazo.valueOf(vector.get("esperado").get("plazo").asString()));
    }
}
