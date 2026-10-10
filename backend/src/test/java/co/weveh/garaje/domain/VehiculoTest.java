package co.weveh.garaje.domain;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import co.weveh.shared.domain.DatoInvalidoException;
import co.weveh.shared.domain.DispositivoId;
import co.weveh.shared.domain.TipoVehiculo;
import java.time.LocalDate;
import java.util.UUID;
import org.junit.jupiter.api.Test;

/**
 * RF-GAR-02 y RF-GAR-03 con la Prado de referencia (skill dominio-vehiculo §1).
 */
class VehiculoTest {

    static final LocalDate HOY = LocalDate.of(2026, 10, 8);
    static final DispositivoId DISPOSITIVO = DispositivoId.desdeTexto("3f1c9a2e-8b4d-4f6a-9c1e-2d7b5a0e4c11");

    static RegistroInicial registroPrado() {
        return new RegistroInicial(188000, LocalDate.of(2026, 6, 5), LocalDate.of(2026, 6, 30),
                LocalDate.of(2026, 6, 28), false, LocalDate.of(2026, 7, 5), "Sura");
    }

    static Vehiculo.DatosRegistro datos(int km, int anio, String placa, RegistroInicial registro) {
        return new Vehiculo.DatosRegistro(TipoVehiculo.CARRO, 7811L, "TOYOTA", " PRADO  VX 5P AT ", 3400, anio, null,
                Transmision.AUTOMATICA, Traccion.TRACCION_4X4, " La Prado ", placa, null, km, null, null, registro);
    }

    static Vehiculo registrar(Vehiculo.DatosRegistro datos) {
        return Vehiculo.registrar(UUID.randomUUID(), DISPOSITIVO, datos, HOY);
    }

    @Test
    void registraLaPradoConValoresPorDefecto() {
        var prado = registrar(datos(190000, 2008, "abc 123", registroPrado()));

        assertThat(prado.linea()).isEqualTo("PRADO VX 5P AT");
        assertThat(prado.alias()).isEqualTo("La Prado");
        assertThat(prado.placa()).isEqualTo("ABC123");
        assertThat(prado.uso()).isEqualTo(UsoVehiculo.MIXTO);
        assertThat(prado.kmPromedioMes()).isEqualTo(1000);
        assertThat(prado.km().valor()).isEqualTo(190000);
        assertThat(prado.nombreParaMostrar()).isEqualTo("La Prado");
    }

    @Test
    void kilometrajeNegativoSeRechazaConMensajeClaro() {
        assertThatThrownBy(() -> registrar(datos(-1, 2008, null, registroPrado())))
                .isInstanceOf(DatoInvalidoException.class)
                .hasMessage("El kilometraje debe ser mayor o igual a cero");
    }

    @Test
    void anioFueraDeRangoSeRechaza() {
        assertThatThrownBy(() -> registrar(datos(190000, 2028, null, registroPrado())))
                .hasMessageContaining("entre 1950 y 2027");
        assertThatThrownBy(() -> registrar(datos(190000, 1949, null, registroPrado())))
                .isInstanceOf(DatoInvalidoException.class);
    }

    @Test
    void placaConFormatoRaroSeRechaza() {
        assertThatThrownBy(() -> registrar(datos(190000, 2008, "AB", registroPrado())))
                .hasMessageContaining("placa");
    }

    @Test
    void noSeDelCambioDeAceiteEsValido() {
        var registro = new RegistroInicial(null, null, LocalDate.of(2026, 6, 30), null, true, null, null);

        var vehiculo = registrar(datos(5000, 2025, null, registro));

        assertThat(vehiculo.registroInicial().aceiteKm()).isNull();
    }

    @Test
    void aceiteConMasKilometrosQueElVehiculoSeRechaza() {
        var registro = new RegistroInicial(200000, LocalDate.of(2026, 6, 5), LocalDate.of(2026, 6, 30),
                LocalDate.of(2026, 6, 28), false, null, null);

        assertThatThrownBy(() -> registrar(datos(190000, 2008, null, registro)))
                .hasMessageContaining("cambio de aceite");
    }

    @Test
    void aceiteConKilometrajeSinFechaSeRechaza() {
        var registro = new RegistroInicial(188000, null, LocalDate.of(2026, 6, 30), LocalDate.of(2026, 6, 28), false, null, null);

        assertThatThrownBy(() -> registrar(datos(190000, 2008, null, registro)))
                .hasMessageContaining("No sé");
    }

    @Test
    void sinSoatSeRechaza() {
        var registro = new RegistroInicial(null, null, null, LocalDate.of(2026, 6, 28), false, null, null);

        assertThatThrownBy(() -> registrar(datos(190000, 2008, null, registro))).hasMessageContaining("SOAT");
    }

    @Test
    void sinRtmNiAunNoAplicaSeRechaza() {
        var registro = new RegistroInicial(null, null, LocalDate.of(2026, 6, 30), null, false, null, null);

        assertThatThrownBy(() -> registrar(datos(190000, 2008, null, registro))).hasMessageContaining("Aún no aplica");
    }

    @Test
    void fechasFuturasSeRechazan() {
        var registro = new RegistroInicial(null, null, LocalDate.of(2026, 10, 9), null, true, null, null);

        assertThatThrownBy(() -> registrar(datos(190000, 2008, null, registro))).hasMessageContaining("futura");
    }

    @Test
    void editarCambiaSoloLoEditableYValida() {
        var prado = registrar(datos(190000, 2008, null, registroPrado()));

        var editado = prado.editar("Mi Prado", "xyz-987", UsoVehiculo.CARRETERA, 2500, null, HOY);

        assertThat(editado.alias()).isEqualTo("Mi Prado");
        assertThat(editado.placa()).isEqualTo("XYZ987");
        assertThat(editado.uso()).isEqualTo(UsoVehiculo.CARRETERA);
        assertThat(editado.km()).isEqualTo(prado.km());
        assertThatThrownBy(() -> prado.editar(null, null, UsoVehiculo.MIXTO, 25000, null, HOY))
                .hasMessageContaining("kilómetros al mes");
    }
}
