package co.weveh.mecanicoia.application;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import co.weveh.garaje.GarajeApi;
import co.weveh.mecanicoia.application.puertos.ConsultaRepositorio;
import co.weveh.mecanicoia.application.puertos.MotorDiagnostico;
import co.weveh.mecanicoia.domain.Diagnostico;
import co.weveh.mecanicoia.domain.NivelGravedad;
import co.weveh.shared.domain.ConflictoException;
import co.weveh.shared.domain.DatoInvalidoException;
import co.weveh.shared.domain.DispositivoId;
import co.weveh.shared.domain.RecursoNoEncontradoException;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import tools.jackson.databind.json.JsonMapper;

class ConsultarMecanicoServicioTest {

    static final DispositivoId DISPOSITIVO = DispositivoId.desdeTexto("3f1c9a2e-8b4d-4f6a-9c1e-2d7b5a0e4c11");
    static final UUID VEHICULO = UUID.randomUUID();
    static final GarajeApi.DatosVehiculo PRADO = new GarajeApi.DatosVehiculo(VEHICULO, "CARRO", "TOYOTA", "PRADO VX 5P AT",
            3400, 2008, "GASOLINA", "AUTOMATICA", "4X4", 190000, "MIXTO", 1000, 188000, LocalDate.of(2026, 6, 5),
            LocalDate.of(2026, 6, 30), LocalDate.of(2026, 6, 28), false);

    GarajeApi garaje = mock(GarajeApi.class);
    MotorDiagnostico motor = mock(MotorDiagnostico.class);
    ConsultaRepositorio consultas = mock(ConsultaRepositorio.class);
    ConsultarMecanicoServicio servicio = new ConsultarMecanicoServicio(garaje, motor, consultas, JsonMapper.builder().build());

    static Diagnostico leve() {
        return new Diagnostico("Plumillas gastadas", NivelGravedad.LEVE, "Las gomas se endurecieron.", "Cámbialas pronto.",
                "$40.000 - $80.000 COP", false, false, List.of("plumillas"), List.of(), false);
    }

    @BeforeEach
    void preparar() {
        when(garaje.buscar(DISPOSITIVO, VEHICULO)).thenReturn(Optional.of(PRADO));
        when(motor.modelos()).thenReturn("modelo-a,modelo-b");
        when(motor.versionPrompt()).thenReturn("mecanico-v1");
    }

    @Test
    void alModeloSoloVaElContextoDelVehiculoYElSintoma() {
        when(motor.diagnosticar(anyString())).thenReturn(Optional.of(new MotorDiagnostico.Respuesta(leve(), "modelo-b")));

        servicio.consultar(DISPOSITIVO, VEHICULO, "las plumillas dejan rayas");

        var contexto = ArgumentCaptor.forClass(String.class);
        verify(motor).diagnosticar(contexto.capture());
        assertThat(contexto.getValue())
                .contains("PRADO VX 5P AT", "190000", "las plumillas dejan rayas")
                .doesNotContain(DISPOSITIVO.toString(), "placa", "alias");
    }

    @Test
    void elValidadorGanaSobreElModelo() {
        when(motor.diagnosticar(anyString())).thenReturn(Optional.of(new MotorDiagnostico.Respuesta(leve(), "modelo-b")));

        var diagnostico = servicio.consultar(DISPOSITIVO, VEHICULO, "se prendió una luz roja pero anda perfecto");

        assertThat(diagnostico.nivelGravedad()).isEqualTo(NivelGravedad.CRITICO);
        assertThat(diagnostico.requiereMecanico()).isTrue();
    }

    @Test
    void guardaElModeloQueRespondio() {
        when(motor.diagnosticar(anyString())).thenReturn(Optional.of(new MotorDiagnostico.Respuesta(leve(), "modelo-b")));

        var diagnostico = servicio.consultar(DISPOSITIVO, VEHICULO, "las plumillas dejan rayas");

        verify(consultas).guardar(any(), eq(VEHICULO), anyString(), eq(diagnostico), eq("modelo-b"), eq("mecanico-v1"));
    }

    @Test
    void reintentaUnaVezYLuegoDaLaRespuestaSegura() {
        when(motor.diagnosticar(anyString())).thenReturn(Optional.empty());

        var diagnostico = servicio.consultar(DISPOSITIVO, VEHICULO, "hace un ruido raro");

        verify(motor, times(2)).diagnosticar(anyString());
        assertThat(diagnostico.seguro()).isTrue();
        verify(consultas).guardar(any(), eq(VEHICULO), eq("hace un ruido raro"), eq(diagnostico), eq("modelo-a,modelo-b"), eq("mecanico-v1"));
    }

    @Test
    void vehiculoDeOtroDispositivoNoLlegaAlModelo() {
        var ajeno = UUID.randomUUID();
        when(garaje.buscar(DISPOSITIVO, ajeno)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> servicio.consultar(DISPOSITIVO, ajeno, "hace un ruido")).isInstanceOf(RecursoNoEncontradoException.class);
        verify(motor, times(0)).diagnosticar(anyString());
    }

    @Test
    void sintomaVacioSeRechaza() {
        assertThatThrownBy(() -> servicio.consultar(DISPOSITIVO, VEHICULO, "  ")).isInstanceOf(DatoInvalidoException.class);
    }

    @Test
    void respetaElLimiteDiario() {
        when(consultas.contarUltimoDia(VEHICULO)).thenReturn(ConsultarMecanico.CONSULTAS_POR_DIA);

        assertThatThrownBy(() -> servicio.consultar(DISPOSITIVO, VEHICULO, "hace un ruido")).isInstanceOf(ConflictoException.class);
    }
}
