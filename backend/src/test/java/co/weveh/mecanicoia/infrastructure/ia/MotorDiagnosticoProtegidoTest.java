package co.weveh.mecanicoia.infrastructure.ia;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import co.weveh.mecanicoia.application.puertos.MotorDiagnostico;
import co.weveh.mecanicoia.domain.Diagnostico;
import co.weveh.shared.domain.MuchaDemandaException;
import java.time.Duration;
import java.util.Optional;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicInteger;
import org.junit.jupiter.api.Test;

/** ADR 0010: cortacircuitos y compartimento delante de OpenRouter. */
class MotorDiagnosticoProtegidoTest {

    static final MotorDiagnostico.Respuesta BUENA = new MotorDiagnostico.Respuesta(Diagnostico.respuestaSegura(), "modelo:free");

    /** Un motor falso que responde lo que se le diga y cuenta las llamadas. */
    static class MotorFalso implements MotorDiagnostico {

        final AtomicInteger llamadas = new AtomicInteger();
        volatile boolean responde = false;

        @Override
        public Optional<Respuesta> diagnosticar(String contextoJson) {
            llamadas.incrementAndGet();
            return responde ? Optional.of(BUENA) : Optional.empty();
        }

        @Override
        public String modelos() {
            return "modelo:free";
        }

        @Override
        public String versionPrompt() {
            return "v1";
        }
    }

    @Test
    void tresFallasSeguidasAbrenElCortacircuitosYYaNoSeLlamaAlModelo() {
        var motor = new MotorFalso();
        var protegido = new MotorDiagnosticoProtegido(motor, Duration.ofMinutes(1), 10);

        for (var i = 0; i < MotorDiagnosticoProtegido.FALLAS_PARA_ABRIR; i++) {
            assertThat(protegido.diagnosticar("{}")).isEmpty();
        }
        assertThat(protegido.estadoCortacircuitos()).isEqualTo("abierto");

        assertThat(protegido.diagnosticar("{}")).isEmpty();
        assertThat(motor.llamadas).hasValue(MotorDiagnosticoProtegido.FALLAS_PARA_ABRIR);
    }

    @Test
    void pasadaLaEsperaPruebaUnaConsultaYSiFuncionaVuelveALaNormalidad() throws InterruptedException {
        var motor = new MotorFalso();
        var protegido = new MotorDiagnosticoProtegido(motor, Duration.ofMillis(50), 10);
        for (var i = 0; i < MotorDiagnosticoProtegido.FALLAS_PARA_ABRIR; i++) {
            protegido.diagnosticar("{}");
        }

        TimeUnit.MILLISECONDS.sleep(120);
        motor.responde = true;

        assertThat(protegido.diagnosticar("{}")).contains(BUENA);
        assertThat(protegido.estadoCortacircuitos()).isEqualTo("cerrado");
    }

    @Test
    void conRespuestasValidasSigueCerrado() {
        var motor = new MotorFalso();
        motor.responde = true;
        var protegido = new MotorDiagnosticoProtegido(motor, Duration.ofMinutes(1), 10);

        for (var i = 0; i < 5; i++) {
            assertThat(protegido.diagnosticar("{}")).contains(BUENA);
        }
        assertThat(protegido.estadoCortacircuitos()).isEqualTo("cerrado");
        assertThat(protegido.modelos()).isEqualTo("modelo:free");
        assertThat(protegido.versionPrompt()).isEqualTo("v1");
    }

    @Test
    void conElCupoLlenoLaSiguienteConsultaEsMuchaDemanda() throws Exception {
        var dentro = new CountDownLatch(1);
        var soltar = new CountDownLatch(1);
        var lento = new MotorFalso() {
            @Override
            public Optional<Respuesta> diagnosticar(String contextoJson) {
                dentro.countDown();
                try {
                    soltar.await(5, TimeUnit.SECONDS);
                } catch (InterruptedException interrumpido) {
                    Thread.currentThread().interrupt();
                }
                return Optional.of(BUENA);
            }
        };
        var protegido = new MotorDiagnosticoProtegido(lento, Duration.ofMinutes(1), 1);

        var primera = CompletableFuture.supplyAsync(() -> protegido.diagnosticar("{}"));
        assertThat(dentro.await(5, TimeUnit.SECONDS)).isTrue();

        assertThatThrownBy(() -> protegido.diagnosticar("{}")).isInstanceOf(MuchaDemandaException.class);

        soltar.countDown();
        assertThat(primera.get(5, TimeUnit.SECONDS)).contains(BUENA);
    }

    @Test
    void laSaludSiempreEstaArribaYDiceElEstadoDelCortacircuitos() {
        var protegido = new MotorDiagnosticoProtegido(new MotorFalso(), Duration.ofMinutes(1), 10);
        var salud = new SaludOpenRouter(protegido).health();

        assertThat(salud.getStatus().getCode()).isEqualTo("UP");
        assertThat(salud.getDetails()).containsEntry("cortacircuitos", "cerrado");
    }
}
