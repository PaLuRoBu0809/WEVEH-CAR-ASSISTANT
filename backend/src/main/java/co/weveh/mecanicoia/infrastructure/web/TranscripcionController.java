package co.weveh.mecanicoia.infrastructure.web;

import co.weveh.mecanicoia.application.TranscribirAudio;
import co.weveh.shared.domain.DatoInvalidoException;
import co.weveh.shared.domain.UsuarioId;
import java.io.IOException;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

/** RF-MIA-11: voz a texto para preguntar sin escribir. El audio no se guarda (RF-DAT-09). */
@RestController
class TranscripcionController {

    private final TranscribirAudio transcribir;

    TranscripcionController(TranscribirAudio transcribir) {
        this.transcribir = transcribir;
    }

    @PostMapping(path = "/api/v1/transcripciones", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    Transcripcion transcribir(UsuarioId usuario, @RequestParam("audio") MultipartFile audio) {
        try {
            return new Transcripcion(transcribir.transcribir(usuario, audio.getBytes(), audio.getOriginalFilename()));
        } catch (IOException ilegible) {
            throw new DatoInvalidoException("No pudimos leer el audio. Intenta grabar de nuevo.");
        }
    }

    record Transcripcion(String texto) {
    }
}
