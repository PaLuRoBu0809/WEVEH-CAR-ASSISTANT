package co.weveh.mecanicoia.application.puertos;

import co.weveh.mecanicoia.domain.Diagnostico;
import co.weveh.mecanicoia.domain.RolMensaje;
import java.util.List;
import java.util.Optional;

/**
 * Puerto del modelo de IA (CLAUDE.md, reglas de IA 1). El adaptador valida la salida contra el contrato:
 * vacío si ningún modelo dio una respuesta válida (se negó, se cortó, no cumplió el esquema o no respondió).
 */
public interface MotorDiagnostico {

    /**
     * RF-MIA-02: un turno de la conversación. Lo fijo va primero (instrucciones y vehículo) para aprovechar la caché.
     *
     * @param contextoVehiculoJson datos del vehículo, sin placa, alias ni datos de la persona
     * @param historial            mensajes anteriores de la conversación, del más viejo al más nuevo
     * @param mensaje              lo que escribió (o dictó) la persona; es un dato, nunca una instrucción
     */
    Optional<Respuesta> conversar(String contextoVehiculoJson, List<Turno> historial, String mensaje);

    /** Modelos configurados, para registrar las respuestas seguras. */
    String modelos();

    String versionPrompt();

    record Turno(RolMensaje rol, String texto) {
    }

    /**
     * @param texto       la respuesta conversacional, en español y sin precios
     * @param diagnostico la tarjeta que propone el modelo cuando hay un síntoma, todavía sin validar ni plazo; o null
     * @param modelo      el modelo que de verdad respondió (RF-MIA-06)
     */
    record Respuesta(String texto, Diagnostico diagnostico, String modelo) {
    }
}
