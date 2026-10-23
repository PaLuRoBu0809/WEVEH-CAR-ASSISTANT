package co.weveh.shared.infrastructure.web;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import co.weveh.shared.domain.ModuloInactivoException;
import java.util.Map;
import org.junit.jupiter.api.Test;
import org.springframework.mock.env.MockEnvironment;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.web.method.HandlerMethod;

/** ADR 0010: WEVEH_MODULO_<NOMBRE>=inactivo apaga ese módulo y solo ese. */
class InterruptorModulosTest {

    static class ControladorDePrueba {
        public void accion() {
            // Solo importa su paquete
        }
    }

    private static InterruptorModulos con(Map<String, String> propiedades) {
        var entorno = new MockEnvironment();
        propiedades.forEach(entorno::setProperty);
        return new InterruptorModulos(entorno);
    }

    private static HandlerMethod manejadorDe(Class<?> tipo) throws NoSuchMethodException {
        return new HandlerMethod(new ControladorDePrueba(), ControladorDePrueba.class.getMethod("accion")) {
            @Override
            public Class<?> getBeanType() {
                return tipo;
            }
        };
    }

    @Test
    void elModuloDeUnControladorSaleDeSuPaquete() {
        assertThat(InterruptorModulos.moduloDe(co.weveh.garaje.GarajeApi.class)).contains("garaje");
        assertThat(InterruptorModulos.moduloDe(String.class)).isEmpty();
    }

    @Test
    void unModuloApagadoRespondeEnMantenimientoYLosDemasSiguen() throws Exception {
        var interruptor = con(Map.of("weveh.modulo.garaje", " Inactivo "));
        var solicitud = new MockHttpServletRequest();
        var respuesta = new MockHttpServletResponse();
        var delGaraje = manejadorDe(co.weveh.garaje.GarajeApi.class);

        assertThatThrownBy(() -> interruptor.preHandle(solicitud, respuesta, delGaraje))
                .isInstanceOf(ModuloInactivoException.class)
                .hasMessageContaining("mantenimiento");
        assertThat(interruptor.preHandle(solicitud, respuesta, manejadorDe(co.weveh.WevehApplication.class))).isTrue();
        assertThat(interruptor.preHandle(solicitud, respuesta, "no es un controlador")).isTrue();
    }

    @Test
    void lasCuentasNoSeApagan() {
        assertThat(con(Map.of("weveh.modulo.cuentas", "inactivo")).estaInactivo("cuentas")).isFalse();
    }

    @Test
    void laSaludMuestraElEstadoDeCadaModuloApagable() {
        assertThat(con(Map.of("weveh.modulo.mecanicoia", "inactivo")).estados())
                .containsExactly(Map.entry("catalogo", "activo"), Map.entry("garaje", "activo"),
                        Map.entry("mecanicoia", "inactivo"));
    }

    @Test
    void unModuloApagadoNoTumbaLaSaludDelServicio() {
        var salud = new SaludModulos(con(Map.of("weveh.modulo.garaje", "inactivo"))).health();

        assertThat(salud.getStatus().getCode()).isEqualTo("UP");
        assertThat(salud.getDetails()).containsEntry("garaje", "inactivo");
    }
}
