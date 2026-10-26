package co.weveh.mecanicoia.infrastructure.web;

import co.weveh.mecanicoia.application.ConversarConMecanico;
import co.weveh.mecanicoia.application.puertos.ConversacionRepositorio;
import co.weveh.mecanicoia.domain.Diagnostico;
import co.weveh.shared.domain.UsuarioId;
import java.time.Instant;
import java.util.List;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

/** RF-MIA-02: conversación continua con el Mecánico IA, por vehículo. */
@RestController
@RequestMapping("/api/v1/vehiculos/{vehiculoId}/conversaciones")
class ConversacionController {

    private final ConversarConMecanico conversar;

    ConversacionController(ConversarConMecanico conversar) {
        this.conversar = conversar;
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    ConversacionCreada crear(UsuarioId usuario, @PathVariable UUID vehiculoId) {
        var creada = conversar.crear(usuario, vehiculoId);
        return new ConversacionCreada(creada.id(), creada.creada());
    }

    @GetMapping
    List<ConversacionResumen> listar(UsuarioId usuario, @PathVariable UUID vehiculoId) {
        return conversar.listar(usuario, vehiculoId).stream().map(ConversacionResumen::desde).toList();
    }

    @GetMapping("/{conversacionId}")
    ConversacionDetalle ver(UsuarioId usuario, @PathVariable UUID vehiculoId, @PathVariable UUID conversacionId) {
        var mensajes = conversar.ver(usuario, vehiculoId, conversacionId).stream().map(MensajeRespuesta::desde).toList();
        return new ConversacionDetalle(conversacionId, mensajes);
    }

    @PostMapping("/{conversacionId}/mensajes")
    RespuestaMecanico enviar(UsuarioId usuario, @PathVariable UUID vehiculoId, @PathVariable UUID conversacionId,
                             @RequestBody MensajeSolicitud solicitud) {
        var respuesta = conversar.enviar(usuario, vehiculoId, conversacionId, solicitud.texto());
        return new RespuestaMecanico(respuesta.respuesta(), TarjetaRespuesta.desde(respuesta.tarjeta()));
    }

    record MensajeSolicitud(String texto) {
    }

    record ConversacionCreada(UUID id, Instant creada) {
    }

    record ConversacionResumen(UUID id, Instant actualizada, String primerMensaje) {
        static ConversacionResumen desde(ConversacionRepositorio.Resumen r) {
            return new ConversacionResumen(r.id(), r.actualizada(), r.primerMensaje());
        }
    }

    record ConversacionDetalle(UUID id, List<MensajeRespuesta> mensajes) {
    }

    /** @param rol PERSONA o MECANICO */
    record MensajeRespuesta(String rol, String texto, TarjetaRespuesta tarjeta, Instant creado) {
        static MensajeRespuesta desde(ConversacionRepositorio.Mensaje m) {
            return new MensajeRespuesta(m.rol().name(), m.texto(), TarjetaRespuesta.desde(m.tarjeta()), m.creado());
        }
    }

    /** @param tarjeta null si el mensaje no describía un síntoma */
    record RespuestaMecanico(String respuesta, TarjetaRespuesta tarjeta) {
    }

    /**
     * RF-MIA-01 y RF-MIA-08: qué puede ser, por qué importa, qué hacer en máximo 3 pasos y el plazo que fija el código.
     *
     * @param nivel      código para la app (LEVE, MODERADO, CRITICO)
     * @param gravedad   texto del contrato ("Crítico", "Moderado", "Leve")
     * @param plazo      código (NO_MANEJAR, HOY, ESTA_SEMANA, PROXIMO_SERVICIO)
     * @param textoPlazo "¿Puedo seguir manejando?" y "¿Cuándo debo llevarlo?" en una frase
     */
    record TarjetaRespuesta(String posibleFalla, String nivel, String gravedad, String plazo, String textoPlazo,
                            String porQueImporta, List<String> pasos, boolean requiereRevisionHumana,
                            boolean requiereMecanico, List<String> piezasRelacionadas, List<String> datosFaltantes,
                            boolean respuestaSegura, String aviso) {

        static TarjetaRespuesta desde(Diagnostico d) {
            if (d == null) {
                return null;
            }
            var plazo = d.plazo();
            return new TarjetaRespuesta(d.posibleFalla(), d.nivelGravedad().name(), d.nivelGravedad().texto(),
                    plazo == null ? null : plazo.name(), plazo == null ? null : plazo.texto(), d.explicacionSimple(),
                    d.pasos(), d.requiereRevisionHumana(), d.requiereMecanico(), d.piezasRelacionadas(),
                    d.datosFaltantes(), d.seguro(), Diagnostico.AVISO);
        }
    }
}
