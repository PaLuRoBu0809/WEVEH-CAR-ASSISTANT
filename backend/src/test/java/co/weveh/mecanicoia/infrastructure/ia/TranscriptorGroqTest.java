package co.weveh.mecanicoia.infrastructure.ia;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.content;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.header;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.requestTo;
import static org.springframework.test.web.client.response.MockRestResponseCreators.withStatus;
import static org.springframework.test.web.client.response.MockRestResponseCreators.withSuccess;

import java.time.Duration;
import java.util.Optional;
import java.util.concurrent.atomic.AtomicInteger;
import org.hamcrest.Matchers;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.test.web.client.MockRestServiceServer;
import org.springframework.web.client.RestClient;

/** ADR 0018 y RF-MIA-11: Whisper de Groq por multipart, en español, y el cortacircuitos de ADR 0010. */
class TranscriptorGroqTest {

    static final String URL = "https://groq.test/openai/v1/audio/transcriptions";

    final RestClient.Builder constructor = RestClient.builder().baseUrl("https://groq.test/openai/v1");
    final MockRestServiceServer servidor = MockRestServiceServer.bindTo(constructor).build();

    @Test
    void mandaElAudioEnEspanolConElModeloYDevuelveElTexto() {
        servidor.expect(requestTo(URL))
                .andExpect(header("Authorization", "Bearer llave"))
                .andExpect(content().string(Matchers.allOf(Matchers.containsString("whisper-large-v3-turbo"),
                        Matchers.containsString("name=\"language\""), Matchers.containsString("name=\"prompt\""),
                        Matchers.containsString("voz.m4a"))))
                .andRespond(withSuccess("{\"text\":\"suena un chillido al frenar\"}", MediaType.APPLICATION_JSON));

        var texto = new TranscriptorGroq("llave", "", constructor.build()).transcribir(new byte[]{1, 2}, "voz.m4a");

        assertThat(texto).contains("suena un chillido al frenar");
        servidor.verify();
    }

    @Test
    void siGroqFallaDevuelveVacio() {
        servidor.expect(requestTo(URL)).andRespond(withStatus(HttpStatus.TOO_MANY_REQUESTS));

        assertThat(new TranscriptorGroq("llave", "", constructor.build()).transcribir(new byte[]{1}, "voz.m4a")).isEmpty();
    }

    @Test
    void sinLlaveNoLlamaAGroq() {
        assertThat(new TranscriptorGroq(" ", "", constructor.build()).transcribir(new byte[]{1}, "voz.m4a")).isEmpty();
        servidor.verify();
    }

    @Test
    void tresFallasSeguidasAbrenElCortacircuitos() {
        var llamadas = new AtomicInteger();
        var protegido = new TranscriptorProtegido((audio, nombre) -> {
            llamadas.incrementAndGet();
            return Optional.empty();
        }, Duration.ofMinutes(1));

        for (var i = 0; i < 5; i++) {
            assertThat(protegido.transcribir(new byte[]{1}, "voz.m4a")).isEmpty();
        }

        assertThat(llamadas).hasValue(MotorDiagnosticoProtegido.FALLAS_PARA_ABRIR);
        assertThat(protegido.estadoCortacircuitos()).isEqualTo("abierto");
    }
}
