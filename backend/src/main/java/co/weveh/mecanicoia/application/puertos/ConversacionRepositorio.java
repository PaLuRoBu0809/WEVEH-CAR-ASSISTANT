package co.weveh.mecanicoia.application.puertos;

import co.weveh.mecanicoia.domain.Diagnostico;
import co.weveh.mecanicoia.domain.RolMensaje;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

/** RF-MIA-02 y RF-MIA-06: conversaciones por vehículo; cada mensaje con su tarjeta, el modelo y la versión del prompt. */
public interface ConversacionRepositorio {

    Instant crear(UUID id, UUID vehiculoId);

    boolean existe(UUID id, UUID vehiculoId);

    /** La más reciente primero. */
    List<Resumen> listar(UUID vehiculoId);

    /** Del más viejo al más nuevo. */
    List<Mensaje> mensajes(UUID conversacionId);

    /** Los últimos {@code cuantos}, del más viejo al más nuevo: lo que se le manda al modelo. */
    List<Mensaje> ultimos(UUID conversacionId, int cuantos);

    /** Guarda el mensaje y marca la conversación como actualizada. */
    void guardar(UUID conversacionId, Mensaje mensaje, String modelo, String versionPrompt);

    record Resumen(UUID id, Instant actualizada, String primerMensaje) {
    }

    /** @param tarjeta ya validada (gravedad y plazo del código), o null */
    record Mensaje(UUID id, RolMensaje rol, String texto, Diagnostico tarjeta, Instant creado) {
    }
}
