package co.weveh.mecanicoia.application.puertos;

import co.weveh.mecanicoia.domain.Diagnostico;
import java.util.Optional;

/**
 * Puerto del modelo de IA (CLAUDE.md, reglas de IA 1). El adaptador valida la salida contra el contrato:
 * vacío si el modelo se negó, se cortó o devolvió algo que no cumple el esquema.
 */
public interface MotorDiagnostico {

    /**
     * @param contextoJson contexto del vehículo y síntoma, sin placa, alias ni dispositivo
     */
    Optional<Diagnostico> diagnosticar(String contextoJson);

    String modelo();

    String versionPrompt();
}
