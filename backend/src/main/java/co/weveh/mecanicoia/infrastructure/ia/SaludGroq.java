package co.weveh.mecanicoia.infrastructure.ia;

import org.springframework.boot.health.contributor.Health;
import org.springframework.boot.health.contributor.HealthIndicator;
import org.springframework.stereotype.Component;

/**
 * ADR 0010: /actuator/health muestra el estado del cortacircuitos de Groq. Siempre UP: sin voz la persona escribe y el
 * resto de WEVEH sigue.
 */
@Component("groq")
class SaludGroq implements HealthIndicator {

    private final TranscriptorProtegido transcriptor;

    SaludGroq(TranscriptorProtegido transcriptor) {
        this.transcriptor = transcriptor;
    }

    @Override
    public Health health() {
        return Health.up().withDetail("cortacircuitos", transcriptor.estadoCortacircuitos()).build();
    }
}
