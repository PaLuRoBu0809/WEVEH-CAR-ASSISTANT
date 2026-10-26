package co.weveh.mecanicoia.application;

import co.weveh.garaje.GarajeApi;
import co.weveh.mecanicoia.application.puertos.ConversacionRepositorio;
import co.weveh.mecanicoia.application.puertos.ConversacionRepositorio.Mensaje;
import co.weveh.mecanicoia.application.puertos.MotorDiagnostico;
import co.weveh.mecanicoia.application.puertos.UsoIaRepositorio;
import co.weveh.mecanicoia.domain.Diagnostico;
import co.weveh.mecanicoia.domain.RolMensaje;
import co.weveh.mecanicoia.domain.ValidadorSeguridadDiagnostico;
import co.weveh.shared.domain.DatoInvalidoException;
import co.weveh.shared.domain.LimiteDiarioException;
import co.weveh.shared.domain.RecursoNoEncontradoException;
import co.weveh.shared.domain.UsuarioId;
import java.time.Instant;
import java.util.List;
import java.util.UUID;
import org.springframework.stereotype.Service;
import tools.jackson.databind.json.JsonMapper;

/**
 * Arma el contexto, llama al modelo (un reintento si la salida no cumple el contrato), aplica la regla de seguridad a
 * cada mensaje y guarda los dos lados de la conversación. Sin @Transactional: no se mantiene una conexión abierta
 * mientras el modelo piensa.
 */
@Service
class ConversarConMecanicoServicio implements ConversarConMecanico {

    static final String RESPUESTA_SEGURA = "No pude responderte en este momento. Si notas frenos raros, humo, "
            + "recalentamiento o un testigo rojo, detén el vehículo y llama a un mecánico. Si no, intenta de nuevo en "
            + "unos minutos.";
    private static final int INTENTOS = 2;
    /** Hasta la etapa 7 no hay plan: ninguna pieza está vencida. */
    private static final boolean SIN_PLAN = false;

    private final GarajeApi garaje;
    private final MotorDiagnostico motor;
    private final ConversacionRepositorio conversaciones;
    private final UsoIaRepositorio uso;
    private final JsonMapper json;

    ConversarConMecanicoServicio(GarajeApi garaje, MotorDiagnostico motor, ConversacionRepositorio conversaciones,
                                 UsoIaRepositorio uso, JsonMapper json) {
        this.garaje = garaje;
        this.motor = motor;
        this.conversaciones = conversaciones;
        this.uso = uso;
        this.json = json;
    }

    @Override
    public Creada crear(UsuarioId usuario, UUID vehiculoId) {
        vehiculo(usuario, vehiculoId);
        var id = UUID.randomUUID();
        return new Creada(id, conversaciones.crear(id, vehiculoId));
    }

    @Override
    public List<ConversacionRepositorio.Resumen> listar(UsuarioId usuario, UUID vehiculoId) {
        vehiculo(usuario, vehiculoId);
        return conversaciones.listar(vehiculoId);
    }

    @Override
    public List<Mensaje> ver(UsuarioId usuario, UUID vehiculoId, UUID conversacionId) {
        conversacion(usuario, vehiculoId, conversacionId);
        return conversaciones.mensajes(conversacionId);
    }

    @Override
    public Respuesta enviar(UsuarioId usuario, UUID vehiculoId, UUID conversacionId, String texto) {
        var limpio = texto == null ? "" : texto.strip();
        if (limpio.length() < LARGO_MINIMO) {
            throw new DatoInvalidoException("Cuéntanos qué le pasa a tu vehículo o qué quieres saber");
        }
        if (limpio.length() > LARGO_MAXIMO) {
            throw new DatoInvalidoException("Escríbelo en menos de 1.000 caracteres");
        }
        var vehiculo = conversacion(usuario, vehiculoId, conversacionId);
        if (uso.contarUltimoDia(usuario) >= TOPE_DIARIO) {
            throw new LimiteDiarioException();
        }
        uso.registrar(usuario, UsoIaRepositorio.Tipo.MENSAJE);

        var historial = conversaciones.ultimos(conversacionId, MENSAJES_DE_CONTEXTO).stream()
                .map(m -> new MotorDiagnostico.Turno(m.rol(), m.texto()))
                .toList();
        var contexto = json.writeValueAsString(ContextoDiagnostico.de(vehiculo));
        var respuesta = conversarConReintento(contexto, historial, limpio);

        var tarjeta = tarjeta(limpio, respuesta == null ? null : respuesta.diagnostico());
        var textoRespuesta = respuesta == null ? RESPUESTA_SEGURA : respuesta.texto();
        var modelo = respuesta == null ? motor.modelos() : respuesta.modelo();

        conversaciones.guardar(conversacionId, new Mensaje(UUID.randomUUID(), RolMensaje.PERSONA, limpio, null, Instant.now()),
                null, null);
        conversaciones.guardar(conversacionId,
                new Mensaje(UUID.randomUUID(), RolMensaje.MECANICO, textoRespuesta, tarjeta, Instant.now()),
                modelo, motor.versionPrompt());
        return new Respuesta(textoRespuesta, tarjeta);
    }

    /**
     * RF-MIA-03: la regla corre sobre cada mensaje. Si el modelo mandó tarjeta se valida; si no la mandó pero la persona
     * describió algo crítico, la tarjeta sale igual.
     */
    private static Diagnostico tarjeta(String texto, Diagnostico propuesta) {
        if (propuesta != null) {
            return ValidadorSeguridadDiagnostico.aplicar(texto, propuesta, SIN_PLAN);
        }
        return ValidadorSeguridadDiagnostico.causaCritica(texto)
                .map(causa -> ValidadorSeguridadDiagnostico.tarjetaPorSenal(causa, SIN_PLAN))
                .orElse(null);
    }

    private MotorDiagnostico.Respuesta conversarConReintento(String contexto, List<MotorDiagnostico.Turno> historial,
                                                            String texto) {
        for (var intento = 0; intento < INTENTOS; intento++) {
            var respuesta = motor.conversar(contexto, historial, texto);
            if (respuesta.isPresent()) {
                return respuesta.get();
            }
        }
        return null;
    }

    private GarajeApi.DatosVehiculo vehiculo(UsuarioId usuario, UUID vehiculoId) {
        return garaje.buscar(usuario, vehiculoId)
                .orElseThrow(() -> new RecursoNoEncontradoException("No encontramos ese vehículo en tu garaje"));
    }

    private GarajeApi.DatosVehiculo conversacion(UsuarioId usuario, UUID vehiculoId, UUID conversacionId) {
        var vehiculo = vehiculo(usuario, vehiculoId);
        if (!conversaciones.existe(conversacionId, vehiculoId)) {
            throw new RecursoNoEncontradoException("No encontramos esa conversación");
        }
        return vehiculo;
    }
}
