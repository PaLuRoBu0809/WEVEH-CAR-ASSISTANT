package co.weveh.mecanicoia.infrastructure.ia;

import co.weveh.mecanicoia.application.puertos.MotorDiagnostico;
import co.weveh.shared.domain.MuchaDemandaException;
import io.github.resilience4j.bulkhead.Bulkhead;
import io.github.resilience4j.bulkhead.BulkheadConfig;
import io.github.resilience4j.bulkhead.BulkheadFullException;
import io.github.resilience4j.circuitbreaker.CallNotPermittedException;
import io.github.resilience4j.circuitbreaker.CircuitBreaker;
import io.github.resilience4j.circuitbreaker.CircuitBreakerConfig;
import io.github.resilience4j.circuitbreaker.CircuitBreakerConfig.SlidingWindowType;
import java.time.Duration;
import java.util.Optional;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Primary;
import org.springframework.stereotype.Component;

/**
 * ADR 0010: protege las llamadas a OpenRouter sin tocar el caso de uso ni el adaptador.
 * <ul>
 *   <li><b>Cortacircuitos:</b> si la cadena de modelos falla 3 veces seguidas, durante 60 s se responde vacío al
 *   instante (el caso de uso da la respuesta segura) en vez de esperar hasta 45 s por intento; luego prueba una
 *   consulta y, si funciona, vuelve a la normalidad.</li>
 *   <li><b>Compartimento:</b> máximo 10 consultas de IA a la vez; la siguiente responde "mucha demanda" (503) para
 *   no dejar sin hilos al resto del backend.</li>
 * </ul>
 */
@Primary
@Component
class MotorDiagnosticoProtegido implements MotorDiagnostico {

    static final int FALLAS_PARA_ABRIR = 3;
    static final Duration ESPERA_ABIERTO = Duration.ofSeconds(60);
    static final int CONSULTAS_A_LA_VEZ = 10;

    private final MotorDiagnostico motor;
    private final CircuitBreaker cortacircuitos;
    private final Bulkhead compartimento;

    @Autowired
    MotorDiagnosticoProtegido(MotorDiagnosticoOpenRouter motor) {
        this(motor, ESPERA_ABIERTO, CONSULTAS_A_LA_VEZ);
    }

    /** Para las pruebas: espera y cupo cortos. */
    MotorDiagnosticoProtegido(MotorDiagnostico motor, Duration esperaAbierto, int consultasALaVez) {
        this.motor = motor;
        this.cortacircuitos = CircuitBreaker.of("openrouter", CircuitBreakerConfig.custom()
                .slidingWindowType(SlidingWindowType.COUNT_BASED)
                .slidingWindowSize(FALLAS_PARA_ABRIR)
                .minimumNumberOfCalls(FALLAS_PARA_ABRIR)
                .failureRateThreshold(100)
                .waitDurationInOpenState(esperaAbierto)
                .permittedNumberOfCallsInHalfOpenState(1)
                // Ningún modelo dio una respuesta válida: para el cortacircuitos también es una falla
                .recordResult(resultado -> resultado instanceof Optional<?> respuesta && respuesta.isEmpty())
                .build());
        this.compartimento = Bulkhead.of("openrouter", BulkheadConfig.custom()
                .maxConcurrentCalls(consultasALaVez)
                .maxWaitDuration(Duration.ZERO)
                .build());
    }

    @Override
    public Optional<Respuesta> diagnosticar(String contextoJson) {
        try {
            return Bulkhead.decorateSupplier(compartimento,
                    CircuitBreaker.decorateSupplier(cortacircuitos, () -> motor.diagnosticar(contextoJson))).get();
        } catch (CallNotPermittedException abierto) {
            return Optional.empty();
        } catch (BulkheadFullException lleno) {
            throw new MuchaDemandaException();
        }
    }

    @Override
    public String modelos() {
        return motor.modelos();
    }

    @Override
    public String versionPrompt() {
        return motor.versionPrompt();
    }

    /** Para la salud por módulo: "cerrado" (normal), "abierto" (respuesta segura al instante) o "medio-abierto". */
    String estadoCortacircuitos() {
        return switch (cortacircuitos.getState()) {
            case OPEN, FORCED_OPEN -> "abierto";
            case HALF_OPEN -> "medio-abierto";
            default -> "cerrado";
        };
    }
}
