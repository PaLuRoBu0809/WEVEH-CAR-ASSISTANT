package co.weveh.mecanicoia.application;

import co.weveh.mecanicoia.application.puertos.Transcriptor;
import co.weveh.mecanicoia.application.puertos.UsoIaRepositorio;
import co.weveh.shared.domain.DatoInvalidoException;
import co.weveh.shared.domain.LimiteDiarioException;
import co.weveh.shared.domain.ServicioNoDisponibleException;
import co.weveh.shared.domain.UsuarioId;
import java.text.Normalizer;
import java.util.Locale;
import java.util.regex.Pattern;
import org.springframework.stereotype.Service;

/** El audio solo pasa por memoria: no se guarda ni se registra (RF-DAT-09). */
@Service
class TranscribirAudioServicio implements TranscribirAudio {

    static final String NO_ENTENDI = "No pude entender el audio, escríbelo.";
    /**
     * Lo que Whisper inventa cuando recibe silencio o ruido (probado con Groq el 2026-10-26: 3 s de silencio dan
     * "Gracias."). Si la transcripción es solo eso, no hubo voz.
     */
    private static final Pattern SOLO_GRACIAS =
            Pattern.compile("^((muchas )?gracias( por (ver( el video)?|su atencion|tu atencion))?[ .!]*)+$");
    private static final Pattern FIRMA_DE_VIDEO = Pattern.compile("subtitulos (realizados|hechos) por|amara\\.org|^suscribete");

    private final Transcriptor transcriptor;
    private final UsoIaRepositorio uso;

    TranscribirAudioServicio(Transcriptor transcriptor, UsoIaRepositorio uso) {
        this.transcriptor = transcriptor;
        this.uso = uso;
    }

    @Override
    public String transcribir(UsuarioId usuario, byte[] audio, String nombre) {
        if (audio == null || audio.length == 0) {
            throw new DatoInvalidoException("No llegó el audio. Intenta grabar de nuevo.");
        }
        if (audio.length > TAMANO_MAXIMO) {
            throw new DatoInvalidoException("El audio es muy largo: grábalo en menos de 60 segundos.");
        }
        if (uso.contarUltimoDia(usuario) >= ConversarConMecanico.TOPE_DIARIO) {
            throw new LimiteDiarioException();
        }
        uso.registrar(usuario, UsoIaRepositorio.Tipo.AUDIO);
        return transcriptor.transcribir(audio, nombre)
                .map(String::strip)
                .filter(texto -> !texto.isEmpty() && !inventadoConSilencio(texto))
                .orElseThrow(() -> new ServicioNoDisponibleException(NO_ENTENDI));
    }

    static boolean inventadoConSilencio(String texto) {
        var normalizado = Normalizer.normalize(texto, Normalizer.Form.NFKD).replaceAll("\\p{M}", "")
                .toLowerCase(Locale.ROOT).replaceAll("[¡¿,]", "").strip();
        return SOLO_GRACIAS.matcher(normalizado).matches() || FIRMA_DE_VIDEO.matcher(normalizado).find();
    }
}
