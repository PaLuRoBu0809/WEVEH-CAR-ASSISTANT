package co.weveh.mecanicoia.application.puertos;

import co.weveh.mecanicoia.domain.Diagnostico;
import java.util.Optional;

/**
 * Puerto del modelo de IA (CLAUDE.md, reglas de IA 1). El adaptador valida la salida contra el contrato:
 * vacío si ningún modelo dio una respuesta válida (se negó, se cortó, no cumplió el esquema o no respondió).
 */
public interface MotorDiagnostico {

    /**
     * @param contextoJson contexto del vehículo y síntoma, sin placa, alias ni dispositivo
     */
    Optional<Respuesta> diagnosticar(String contextoJson);

    /** Modelos configurados, para registrar las respuestas seguras. */
    String modelos();

    String versionPrompt();

    /** @param modelo el modelo que de verdad respondió (RF-MIA-06) */
    record Respuesta(Diagnostico diagnostico, String modelo) {
    }
}
