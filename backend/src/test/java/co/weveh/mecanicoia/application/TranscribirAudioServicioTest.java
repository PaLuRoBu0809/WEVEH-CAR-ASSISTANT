package co.weveh.mecanicoia.application;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import co.weveh.mecanicoia.application.puertos.Transcriptor;
import co.weveh.mecanicoia.application.puertos.UsoIaRepositorio;
import co.weveh.shared.domain.DatoInvalidoException;
import co.weveh.shared.domain.LimiteDiarioException;
import co.weveh.shared.domain.ServicioNoDisponibleException;
import co.weveh.shared.domain.UsuarioId;
import java.util.Optional;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;

/** RF-MIA-11 y RF-MIA-07: voz a texto con el mismo tope diario; si no se entiende, se pide escribirlo. */
class TranscribirAudioServicioTest {

    static final UsuarioId USUARIO = UsuarioId.desdeTexto("3f1c9a2e-8b4d-4f6a-9c1e-2d7b5a0e4c11");
    static final byte[] AUDIO = {1, 2, 3};

    Transcriptor transcriptor = mock(Transcriptor.class);
    UsoIaRepositorio uso = mock(UsoIaRepositorio.class);
    TranscribirAudioServicio servicio = new TranscribirAudioServicio(transcriptor, uso);

    @Test
    void devuelveElTextoLimpioYCuentaElAudio() {
        when(transcriptor.transcribir(AUDIO, "voz.m4a")).thenReturn(Optional.of("  suena un chillido al frenar "));

        assertThat(servicio.transcribir(USUARIO, AUDIO, "voz.m4a")).isEqualTo("suena un chillido al frenar");
        verify(uso).registrar(USUARIO, UsoIaRepositorio.Tipo.AUDIO);
    }

    @Test
    void siNoSeEntiendePideEscribirlo() {
        when(transcriptor.transcribir(any(), any())).thenReturn(Optional.empty());

        assertThatThrownBy(() -> servicio.transcribir(USUARIO, AUDIO, "voz.m4a"))
                .isInstanceOf(ServicioNoDisponibleException.class)
                .hasMessageContaining("escríbelo");
    }

    @Test
    void unTextoVacioTambienPideEscribirlo() {
        when(transcriptor.transcribir(any(), any())).thenReturn(Optional.of("   "));

        assertThatThrownBy(() -> servicio.transcribir(USUARIO, AUDIO, "voz.m4a"))
                .isInstanceOf(ServicioNoDisponibleException.class);
    }

    @Test
    void sinAudioOMuyLargoNoSeTranscribe() {
        assertThatThrownBy(() -> servicio.transcribir(USUARIO, new byte[0], "voz.m4a"))
                .isInstanceOf(DatoInvalidoException.class);
        assertThatThrownBy(() -> servicio.transcribir(USUARIO, new byte[TranscribirAudio.TAMANO_MAXIMO + 1], "voz.m4a"))
                .isInstanceOf(DatoInvalidoException.class)
                .hasMessageContaining("60 segundos");
        verify(transcriptor, never()).transcribir(any(), any());
    }

    @Test
    void elTopeDiarioFrenaSinLlamarAGroq() {
        when(uso.contarUltimoDia(USUARIO)).thenReturn(ConversarConMecanico.TOPE_DIARIO);

        assertThatThrownBy(() -> servicio.transcribir(USUARIO, AUDIO, "voz.m4a")).isInstanceOf(LimiteDiarioException.class);
        verify(transcriptor, never()).transcribir(any(), any());
    }

    @ParameterizedTest
    @ValueSource(strings = {"Gracias.", "Gracias. Gracias. Gracias.", "¡Gracias por ver el video!", "Muchas gracias.",
            "Subtítulos realizados por la comunidad de Amara.org"})
    void loQueWhisperInventaConSilencioPideEscribirlo(String inventado) {
        when(transcriptor.transcribir(any(), any())).thenReturn(Optional.of(inventado));

        assertThatThrownBy(() -> servicio.transcribir(USUARIO, AUDIO, "voz.m4a"))
                .isInstanceOf(ServicioNoDisponibleException.class)
                .hasMessageContaining("escríbelo");
    }

    @Test
    void unaFraseRealConGraciasPasa() {
        when(transcriptor.transcribir(any(), any())).thenReturn(Optional.of("Gracias, y otra cosa: suena un chillido al frenar"));

        assertThat(servicio.transcribir(USUARIO, AUDIO, "voz.m4a")).contains("chillido");
    }
}
