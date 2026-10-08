package co.weveh.mecanicoia.application;

import co.weveh.garaje.GarajeApi;
import co.weveh.mecanicoia.application.puertos.ConsultaRepositorio;
import co.weveh.mecanicoia.application.puertos.MotorDiagnostico;
import co.weveh.mecanicoia.domain.Diagnostico;
import co.weveh.mecanicoia.domain.ValidadorSeguridadDiagnostico;
import co.weveh.shared.domain.ConflictoException;
import co.weveh.shared.domain.DatoInvalidoException;
import co.weveh.shared.domain.DispositivoId;
import co.weveh.shared.domain.RecursoNoEncontradoException;
import java.util.UUID;
import org.springframework.stereotype.Service;
import tools.jackson.databind.json.JsonMapper;

/**
 * Arma el contexto, llama al modelo (un reintento si la salida no cumple el contrato), aplica el validador de
 * seguridad y guarda la consulta. Sin @Transactional: no se mantiene una conexión abierta mientras el modelo piensa.
 */
@Service
class ConsultarMecanicoServicio implements ConsultarMecanico {

    private static final int INTENTOS = 2;

    private final GarajeApi garaje;
    private final MotorDiagnostico motor;
    private final ConsultaRepositorio consultas;
    private final JsonMapper json;

    ConsultarMecanicoServicio(GarajeApi garaje, MotorDiagnostico motor, ConsultaRepositorio consultas, JsonMapper json) {
        this.garaje = garaje;
        this.motor = motor;
        this.consultas = consultas;
        this.json = json;
    }

    @Override
    public Diagnostico consultar(DispositivoId dispositivo, UUID vehiculoId, String sintoma) {
        var texto = sintoma == null ? "" : sintoma.strip();
        if (texto.length() < 3) {
            throw new DatoInvalidoException("Cuéntanos qué le pasa a tu vehículo");
        }
        if (texto.length() > LARGO_MAXIMO_SINTOMA) {
            throw new DatoInvalidoException("Descríbelo en menos de 1.000 caracteres");
        }
        var vehiculo = garaje.buscar(dispositivo, vehiculoId)
                .orElseThrow(() -> new RecursoNoEncontradoException("No encontramos ese vehículo en tu garaje"));
        if (consultas.contarUltimoDia(vehiculoId) >= CONSULTAS_POR_DIA) {
            throw new ConflictoException("Llegaste al límite de preguntas de hoy para este vehículo. Intenta mañana.");
        }

        var contexto = json.writeValueAsString(ContextoDiagnostico.de(vehiculo, texto));
        var diagnostico = diagnosticarConReintento(contexto);
        // El plan por pieza llega en la fase 2; hasta entonces no hay piezas de seguridad vencidas que cruzar
        var validado = ValidadorSeguridadDiagnostico.aplicar(texto, diagnostico, false);
        consultas.guardar(UUID.randomUUID(), vehiculoId, texto, validado, motor.modelo(), motor.versionPrompt());
        return validado;
    }

    private Diagnostico diagnosticarConReintento(String contexto) {
        for (var intento = 0; intento < INTENTOS; intento++) {
            var respuesta = motor.diagnosticar(contexto);
            if (respuesta.isPresent()) {
                return respuesta.get();
            }
        }
        return Diagnostico.respuestaSegura();
    }
}
