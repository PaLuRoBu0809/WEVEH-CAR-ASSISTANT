package co.weveh.mecanicoia.infrastructure.ia;

import co.weveh.mecanicoia.application.puertos.Transcriptor;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import java.net.http.HttpClient;
import java.time.Duration;
import java.util.Optional;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.http.MediaType;
import org.springframework.http.client.JdkClientHttpRequestFactory;
import org.springframework.stereotype.Component;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;

/**
 * Whisper de Groq solo para pasar voz a texto (ADR 0018): la única excepción a OpenRouter, porque OpenRouter no
 * transcribe. API compatible con OpenAI. El audio va directo del request a Groq y no se escribe en disco ni en logs.
 */
@Component
class TranscriptorGroq implements Transcriptor {

    static final String MODELO_POR_DEFECTO = "whisper-large-v3-turbo";
    private static final Logger LOG = LoggerFactory.getLogger(TranscriptorGroq.class);
    private static final Duration ESPERA = Duration.ofSeconds(20);
    /**
     * Pista de tema para Whisper: mejora las palabras del taller. Es texto fijo de WEVEH, nunca datos de la persona.
     */
    static final String PISTA = "Conversación en español de Colombia con un mecánico sobre un carro o una moto: frenos, "
            + "pastillas, aceite, motor, testigo del tablero, batería, correa, llantas, suspensión, kilometraje.";

    private final RestClient cliente;
    private final String llave;
    private final String modelo;

    @Autowired
    TranscriptorGroq(@Value("${weveh.ia.groq.llave:}") String llave,
                     @Value("${weveh.ia.transcripcion.modelo:}") String modelo,
                     @Value("${weveh.ia.groq.url:https://api.groq.com/openai/v1}") String url) {
        this(llave, modelo, RestClient.builder().baseUrl(url).requestFactory(fabrica()).build());
    }

    TranscriptorGroq(String llave, String modelo, RestClient cliente) {
        this.llave = llave.strip();
        this.modelo = modelo.isBlank() ? MODELO_POR_DEFECTO : modelo.strip();
        this.cliente = cliente;
    }

    private static JdkClientHttpRequestFactory fabrica() {
        var fabrica = new JdkClientHttpRequestFactory(HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(5)).build());
        fabrica.setReadTimeout(ESPERA);
        return fabrica;
    }

    @Override
    public Optional<String> transcribir(byte[] audio, String nombre) {
        if (llave.isEmpty()) {
            LOG.warn("Falta GROQ_API_KEY: no se puede transcribir");
            return Optional.empty();
        }
        var partes = new LinkedMultiValueMap<String, Object>();
        partes.add("file", new ByteArrayResource(audio) {
            @Override
            public String getFilename() {
                return nombre == null || nombre.isBlank() ? "voz.m4a" : nombre;
            }
        });
        partes.add("model", modelo);
        partes.add("language", "es");
        partes.add("prompt", PISTA);
        partes.add("response_format", "json");
        try {
            var respuesta = cliente.post()
                    .uri("/audio/transcriptions")
                    .header("Authorization", "Bearer " + llave)
                    .contentType(MediaType.MULTIPART_FORM_DATA)
                    .body(partes)
                    .retrieve()
                    .body(Transcripcion.class);
            return Optional.ofNullable(respuesta).map(Transcripcion::text);
        } catch (RestClientException error) {
            // Solo el tipo de error: nunca el audio ni el texto
            LOG.warn("Groq no transcribió ({})", error.getClass().getSimpleName());
            return Optional.empty();
        }
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    record Transcripcion(String text) {
    }
}
