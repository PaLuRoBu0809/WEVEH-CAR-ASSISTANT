package co.weveh.mecanicoia.application.puertos;

import co.weveh.shared.domain.UsuarioId;

/** RF-MIA-07: cuenta mensajes y audios por cuenta para el tope diario. Nunca guarda el texto ni el audio. */
public interface UsoIaRepositorio {

    enum Tipo { MENSAJE, AUDIO }

    void registrar(UsuarioId usuario, Tipo tipo);

    /** Mensajes y audios de la cuenta en las últimas 24 horas. */
    int contarUltimoDia(UsuarioId usuario);
}
