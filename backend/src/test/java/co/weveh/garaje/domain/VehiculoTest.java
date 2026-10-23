package co.weveh.garaje.domain;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import co.weveh.shared.domain.ConfirmacionRequeridaException;
import co.weveh.shared.domain.DatoInvalidoException;
import co.weveh.shared.domain.TipoVehiculo;
import co.weveh.shared.domain.UsuarioId;
import java.time.LocalDate;
import java.util.UUID;
import org.junit.jupiter.api.Test;

/**
 * RF-GAR-02, RF-GAR-02b, RF-GAR-03 y RF-GAR-05 con la Prado de referencia (skill dominio-vehiculo §1).
 */
class VehiculoTest {

    static final LocalDate HOY = LocalDate.of(2026, 10, 8);
    static final UsuarioId USUARIO = UsuarioId.desdeTexto("3f1c9a2e-8b4d-4f6a-9c1e-2d7b5a0e4c11");

    static RegistroInicial registroPrado() {
        return new RegistroInicial(188000, LocalDate.of(2026, 6, 5), LocalDate.of(2026, 6, 30),
                LocalDate.of(2026, 6, 28), false, LocalDate.of(2026, 7, 5), "Sura");
    }

    static Vehiculo.DatosRegistro datos(int km, int anio, String placa, RegistroInicial registro) {
        return new Vehiculo.DatosRegistro(TipoVehiculo.CARRO, 7811L, "TOYOTA", " PRADO  VX 5P AT ", 3400, anio, null,
                Transmision.AUTOMATICA, Traccion.TRACCION_4X4, " La Prado ", placa, null, km, null, null, registro);
    }

    static Vehiculo registrar(Vehiculo.DatosRegistro datos) {
        return Vehiculo.registrar(UUID.randomUUID(), USUARIO, datos, HOY);
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
    void conSoloVehiculoYKilometrajeSeRegistraYQuedaLoQueFalta() {
        var prado = registrar(datos(190000, 2008, null, null));

        assertThat(prado.registroInicial()).isEqualTo(RegistroInicial.VACIO);
        assertThat(prado.datosFaltantes()).containsExactly(DatoFaltante.SOAT, DatoFaltante.RTM, DatoFaltante.ACEITE);
    }

    @Test
    void conTodoAlDiaNoFaltaNada() {
        assertThat(registrar(datos(190000, 2008, null, registroPrado())).datosFaltantes()).isEmpty();
    }

    @Test
    void unVehiculoNuevoSinRtmQueAunNoAplicaSoloPideLoDemas() {
        var registro = new RegistroInicial(null, null, LocalDate.of(2026, 6, 30), null, true, null, null);

        assertThat(registrar(datos(5000, 2025, null, registro)).datosFaltantes()).containsExactly(DatoFaltante.ACEITE);
    }

    @Test
    void rtmConFechaYAunNoAplicaALaVezSeRechaza() {
        var registro = new RegistroInicial(null, null, null, LocalDate.of(2026, 6, 28), true, null, null);

        assertThatThrownBy(() -> registrar(datos(190000, 2008, null, registro))).hasMessageContaining("aún no aplica");
    }

    @Test
    void completarElRegistroDespuesUsaLasMismasReglas() {
        var prado = registrar(datos(190000, 2008, null, null));

        var completado = prado.completarRegistro(registroPrado(), HOY);

        assertThat(completado.datosFaltantes()).isEmpty();
        assertThat(completado.km()).isEqualTo(prado.km());
        var aceiteImposible = new RegistroInicial(200000, LocalDate.of(2026, 6, 5), null, null, false, null, null);
        assertThatThrownBy(() -> prado.completarRegistro(aceiteImposible, HOY)).hasMessageContaining("cambio de aceite");
    }

    @Test
    void fechasFuturasSeRechazan() {
        var registro = new RegistroInicial(null, null, LocalDate.of(2026, 10, 9), null, true, null, null);

        assertThatThrownBy(() -> registrar(datos(190000, 2008, null, registro))).hasMessageContaining("futura");
    }

    @Test
    void subirElKilometrajeLoAnotaConSuFecha() {
        var prado = registrar(datos(190000, 2008, null, null));
        var enUnaSemana = HOY.plusDays(7);

        var actualizado = prado.actualizarKilometraje(191200, false, enUnaSemana);

        assertThat(actualizado.km().valor()).isEqualTo(191200);
        assertThat(actualizado.kmActualizadoEn()).isEqualTo(enUnaSemana);
    }

    @Test
    void elKilometrajeNuncaBaja() {
        var prado = registrar(datos(190000, 2008, null, null));

        assertThatThrownBy(() -> prado.actualizarKilometraje(185000, true, HOY))
                .isInstanceOf(DatoInvalidoException.class)
                .hasMessage("El kilometraje no puede bajar: hoy tiene 190.000 km");
    }

    @Test
    void unSaltoRaroPideConfirmacionYConfirmadoPasa() {
        var prado = registrar(datos(190000, 2008, null, null));

        assertThatThrownBy(() -> prado.actualizarKilometraje(192000, false, HOY))
                .isInstanceOf(ConfirmacionRequeridaException.class)
                .hasMessage("Subió 2.000 km desde la última vez. ¿Es correcto?");
        assertThat(prado.actualizarKilometraje(192000, true, HOY).km().valor()).isEqualTo(192000);
    }

    @Test
    void loNormalDependeDeCuantoAndaYDeLosDiasQuePasaron() {
        var prado = registrar(datos(190000, 2008, null, null));
        var enUnMes = HOY.plusDays(30);

        assertThat(prado.saltoEsperadoMaximo(HOY)).isEqualTo(Vehiculo.SALTO_KM_SIN_CONFIRMAR);
        assertThat(prado.saltoEsperadoMaximo(enUnMes)).isEqualTo(3000);
        assertThat(prado.actualizarKilometraje(192500, false, enUnMes).km().valor()).isEqualTo(192500);
    }

    @Test
    void editarCambiaSoloLoEditableYValida() {
        var prado = registrar(datos(190000, 2008, null, registroPrado()));

        var editado = prado.editar(edicion("Mi Prado", "xyz-987", UsoVehiculo.CARRETERA, 2500), HOY);

        assertThat(editado.alias()).isEqualTo("Mi Prado");
        assertThat(editado.placa()).isEqualTo("XYZ987");
        assertThat(editado.uso()).isEqualTo(UsoVehiculo.CARRETERA);
        assertThat(editado.km()).isEqualTo(prado.km());
        var demasiadosKm = edicion(null, null, UsoVehiculo.MIXTO, 25000);
        assertThatThrownBy(() -> prado.editar(demasiadosKm, HOY))
                .hasMessageContaining("kilómetros al mes");
    }

    @Test
    void editarCorrigeCombustibleTransmisionYTraccion() {
        var prado = registrar(datos(190000, 2008, null, registroPrado()));

        var tras = new Vehiculo.DatosEdicion("La Prado", null, UsoVehiculo.MIXTO, 1000, null, Combustible.DIESEL,
                Transmision.MECANICA, Traccion.TRACCION_4X2);
        var editado = prado.editar(tras, HOY);

        assertThat(editado.combustible()).isEqualTo(Combustible.DIESEL);
        assertThat(editado.transmision()).isEqualTo(Transmision.MECANICA);
        assertThat(editado.traccion()).isEqualTo(Traccion.TRACCION_4X2);
    }

    @Test
    void editarSinCombustibleTransmisionNiTraccionConservaLosActuales() {
        var prado = registrar(datos(190000, 2008, null, registroPrado()));

        var editado = prado.editar(edicion("Mi Prado", null, UsoVehiculo.MIXTO, 1000), HOY);

        assertThat(editado.transmision()).isEqualTo(Transmision.AUTOMATICA);
        assertThat(editado.traccion()).isEqualTo(Traccion.TRACCION_4X4);
        assertThat(editado.combustible()).isNull();
    }

    private static Vehiculo.DatosEdicion edicion(String alias, String placa, UsoVehiculo uso, int kmPromedioMes) {
        return new Vehiculo.DatosEdicion(alias, placa, uso, kmPromedioMes, null, null, null, null);
    }

    @Test
    void laUltimaLecturaSePuedeCorregirHaciaAbajoEnSusPrimerosSieteDias() {
        var prado = registrar(datos(190000, 2008, null, null));

        var corregido = prado.corregirKilometraje(185000, 180000, HOY.plusDays(Vehiculo.DIAS_PARA_CORREGIR));

        assertThat(corregido.km().valor()).isEqualTo(185000);
        assertThat(corregido.kmActualizadoEn()).isEqualTo(prado.kmActualizadoEn());
    }

    @Test
    void despuesDeSieteDiasLaLecturaQuedaFija() {
        assertThatThrownBy(() -> registrar(datos(190000, 2008, null, null)).corregirKilometraje(185000, 0, HOY.plusDays(Vehiculo.DIAS_PARA_CORREGIR + 1)))
                .isInstanceOf(DatoInvalidoException.class)
                .hasMessageContaining("7 días");
    }

    @Test
    void corregirNoSirveParaSubirNiParaBajarDeLaLecturaAnterior() {
        var prado = registrar(datos(190000, 2008, null, null));

        assertThatThrownBy(() -> prado.corregirKilometraje(prado.km().valor(), 0, HOY))
                .isInstanceOf(DatoInvalidoException.class)
                .hasMessageContaining("lectura nueva");
        assertThatThrownBy(() -> prado.corregirKilometraje(150000, 160000, HOY))
                .isInstanceOf(DatoInvalidoException.class)
                .hasMessageContaining("160.000");
    }
}
