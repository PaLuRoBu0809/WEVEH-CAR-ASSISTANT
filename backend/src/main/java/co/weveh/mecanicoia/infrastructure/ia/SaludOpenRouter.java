package co.weveh.mecanicoia.infrastructure.ia;

import org.springframework.boot.health.contributor.Health;
import org.springframework.boot.health.contributor.HealthIndicator;
import org.springframework.stereotype.Component;

/**
 * ADR 0010: /actuator/health muestra el estado del cortacircuitos de OpenRouter. Siempre UP: con la IA caída el
 * Mecánico IA da la respuesta segura y el resto de WEVEH sigue; Render no debe reiniciar el servicio por eso.
 */
@Component("openrouter")
class SaludOpenRouter implements HealthIndicator {

    private final MotorDiagnosticoProtegido motor;

    SaludOpenRouter(MotorDiagnosticoProtegido motor) {
        this.motor = motor;
    }

    @Override
    public Health health() {
        return Health.up().withDetail("cortacircuitos", motor.estadoCortacircuitos()).build();
    }
}
