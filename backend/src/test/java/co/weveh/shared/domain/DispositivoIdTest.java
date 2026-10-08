package co.weveh.shared.domain;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.NullAndEmptySource;
import org.junit.jupiter.params.provider.ValueSource;

class DispositivoIdTest {

    @Test
    void aceptaUnUuidV4() {
        var id = DispositivoId.desdeTexto("3f1c9a2e-8b4d-4f6a-9c1e-2d7b5a0e4c11");

        assertThat(id.valor()).isEqualTo(UUID.fromString("3f1c9a2e-8b4d-4f6a-9c1e-2d7b5a0e4c11"));
    }

    @Test
    void aceptaMayusculasYEspaciosAlrededor() {
        var id = DispositivoId.desdeTexto(" 3F1C9A2E-8B4D-4F6A-9C1E-2D7B5A0E4C11 ");

        assertThat(id.toString()).isEqualTo("3f1c9a2e-8b4d-4f6a-9c1e-2d7b5a0e4c11");
    }

    @ParameterizedTest
    @NullAndEmptySource
    @ValueSource(strings = {
            "no-es-un-uuid",
            "3f1c9a2e-8b4d-1f6a-9c1e-2d7b5a0e4c11", // versión 1
            "3f1c9a2e-8b4d-4f6a-7c1e-2d7b5a0e4c11", // variante incorrecta
            "1-1-1-1-1",                            // UUID.fromString lo aceptaría
            "00000000-0000-0000-0000-000000000000"
    })
    void rechazaLoQueNoEsUuidV4(String texto) {
        assertThatThrownBy(() -> DispositivoId.desdeTexto(texto)).isInstanceOf(DispositivoInvalidoException.class);
    }

    @Test
    void rechazaUnUuidDeOtraVersionCreadoDirecto() {
        var uuidV3 = UUID.nameUUIDFromBytes("weveh".getBytes());

        assertThatThrownBy(() -> new DispositivoId(uuidV3)).isInstanceOf(DispositivoInvalidoException.class);
    }
}
