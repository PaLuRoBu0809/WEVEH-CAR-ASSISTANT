package co.weveh.shared.infrastructure.web;

import org.springframework.boot.health.contributor.Health;
import org.springframework.boot.health.contributor.HealthIndicator;
import org.springframework.stereotype.Component;

/**
 * ADR 0010: /actuator/health muestra qué módulos están activos o apagados. Siempre UP: un módulo apagado a propósito
 * no es una falla del servicio.
 */
@Component("modulos")
class SaludModulos implements HealthIndicator {

    private final InterruptorModulos interruptor;

    SaludModulos(InterruptorModulos interruptor) {
        this.interruptor = interruptor;
    }

    @Override
    public Health health() {
        return Health.up().withDetails(interruptor.estados()).build();
    }
}
