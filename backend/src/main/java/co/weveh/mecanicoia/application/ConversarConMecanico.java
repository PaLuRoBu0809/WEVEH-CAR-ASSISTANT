package co.weveh.mecanicoia.application;

import co.weveh.mecanicoia.application.puertos.ConversacionRepositorio;
import co.weveh.mecanicoia.domain.Diagnostico;
import co.weveh.shared.domain.UsuarioId;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

/**
 * RF-MIA-02: la persona conversa con un mecánico que conoce su vehículo; cuando describe un síntoma, la respuesta trae
 * la tarjeta de RF-MIA-01 con la gravedad y el plazo que fija el código (RF-MIA-03, RF-MIA-08).
 */
public interface ConversarConMecanico {

    int LARGO_MINIMO = 3;
    int LARGO_MAXIMO = 1_000;
    /** RF-MIA-07: mensajes y audios al día por cuenta; solo frena un error o un abuso. */
    int TOPE_DIARIO = 100;
    /** Lo que recuerda el modelo de la conversación; la compactación de lo viejo llega en la tanda 6b. */
    int MENSAJES_DE_CONTEXTO = 12;

    Creada crear(UsuarioId usuario, UUID vehiculoId);

    List<ConversacionRepositorio.Resumen> listar(UsuarioId usuario, UUID vehiculoId);

    List<ConversacionRepositorio.Mensaje> ver(UsuarioId usuario, UUID vehiculoId, UUID conversacionId);

    Respuesta enviar(UsuarioId usuario, UUID vehiculoId, UUID conversacionId, String texto);

    record Creada(UUID id, Instant creada) {
    }

    /** @param tarjeta null si el mensaje no describía un síntoma */
    record Respuesta(String respuesta, Diagnostico tarjeta) {
    }
}
