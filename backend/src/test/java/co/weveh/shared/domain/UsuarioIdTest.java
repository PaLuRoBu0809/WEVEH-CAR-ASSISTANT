package co.weveh.shared.domain;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.NullAndEmptySource;
import org.junit.jupiter.params.provider.ValueSource;

class UsuarioIdTest {

    @Test
    void elSubDelTokenEsElIdentificador() {
        var id = UUID.randomUUID();

        assertThat(UsuarioId.desdeTexto(id.toString()).valor()).isEqualTo(id);
    }

    @ParameterizedTest
    @NullAndEmptySource
    @ValueSource(strings = {"no-es-un-uuid", "1234"})
    void unSubQueNoEsUuidNoIdentificaANadie(String sub) {
        assertThatThrownBy(() -> UsuarioId.desdeTexto(sub)).isInstanceOf(NoAutenticadoException.class);
    }
}
