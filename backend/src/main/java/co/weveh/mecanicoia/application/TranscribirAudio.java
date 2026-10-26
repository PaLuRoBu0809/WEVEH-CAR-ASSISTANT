package co.weveh.mecanicoia.application;

import co.weveh.shared.domain.UsuarioId;

/**
 * RF-MIA-11: la persona dicta en vez de escribir; recibe el texto para corregirlo antes de enviarlo. Cuenta en el
 * mismo tope diario que los mensajes (RF-MIA-07).
 */
public interface TranscribirAudio {

    /** 2 MB: 60 segundos de voz en AAC caben de sobra. */
    int TAMANO_MAXIMO = 2 * 1024 * 1024;

    String transcribir(UsuarioId usuario, byte[] audio, String nombre);
}
