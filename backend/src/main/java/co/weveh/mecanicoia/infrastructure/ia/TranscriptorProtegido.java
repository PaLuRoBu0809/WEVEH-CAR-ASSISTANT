package co.weveh.mecanicoia.infrastructure.ia;

import co.weveh.mecanicoia.application.puertos.Transcriptor;
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
 * ADR 0010: el mismo cortacircuitos que OpenRouter. Si Groq falla 3 veces seguidas, durante 60 s se responde al
 * instante "No pude entender el audio, escríbelo" en vez de esperar 20 s por intento.
 */
@Primary
@Component
class TranscriptorProtegido implements Transcriptor {

    private final Transcriptor transcriptor;
    private final CircuitBreaker cortacircuitos;

    @Autowired
    TranscriptorProtegido(TranscriptorGroq transcriptor) {
        this(transcriptor, MotorDiagnosticoProtegido.ESPERA_ABIERTO);
    }

    /** Para las pruebas: espera corta. */
    TranscriptorProtegido(Transcriptor transcriptor, Duration esperaAbierto) {
        this.transcriptor = transcriptor;
        this.cortacircuitos = CircuitBreaker.of("groq", CircuitBreakerConfig.custom()
                .slidingWindowType(SlidingWindowType.COUNT_BASED)
                .slidingWindowSize(MotorDiagnosticoProtegido.FALLAS_PARA_ABRIR)
                .minimumNumberOfCalls(MotorDiagnosticoProtegido.FALLAS_PARA_ABRIR)
                .failureRateThreshold(100)
                .waitDurationInOpenState(esperaAbierto)
                .permittedNumberOfCallsInHalfOpenState(1)
                .recordResult(resultado -> resultado instanceof Optional<?> texto && texto.isEmpty())
                .build());
    }

    @Override
    public Optional<String> transcribir(byte[] audio, String nombre) {
        try {
            return cortacircuitos.executeSupplier(() -> transcriptor.transcribir(audio, nombre));
        } catch (CallNotPermittedException abierto) {
            return Optional.empty();
        }
    }

    /** Para la salud por módulo: "cerrado" (normal), "abierto" (responde al instante) o "medio-abierto". */
    String estadoCortacircuitos() {
        return switch (cortacircuitos.getState()) {
            case OPEN, FORCED_OPEN -> "abierto";
            case HALF_OPEN -> "medio-abierto";
            default -> "cerrado";
        };
    }
}
