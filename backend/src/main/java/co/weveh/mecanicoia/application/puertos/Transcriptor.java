package co.weveh.mecanicoia.application.puertos;

import java.util.Optional;

/**
 * Puerto de voz a texto (ADR 0018, RF-MIA-11). Solo transcribe: ningún modelo interpreta el audio. El audio llega en
 * memoria y no se guarda en ningún lado (RF-DAT-09).
 */
public interface Transcriptor {

    /**
     * @param audio  los bytes de la grabación
     * @param nombre nombre del archivo con su extensión (por ejemplo "voz.m4a"): el proveedor deduce el formato
     * @return el texto, o vacío si el servicio no respondió o no entendió nada
     */
    Optional<String> transcribir(byte[] audio, String nombre);
}
