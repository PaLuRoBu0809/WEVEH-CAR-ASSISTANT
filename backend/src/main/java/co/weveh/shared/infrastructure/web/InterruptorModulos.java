package co.weveh.shared.infrastructure.web;

import co.weveh.shared.domain.ModuloInactivoException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.TreeMap;
import org.springframework.core.env.Environment;
import org.springframework.stereotype.Component;
import org.springframework.web.method.HandlerMethod;
import org.springframework.web.servlet.HandlerInterceptor;

/**
 * ADR 0010: {@code WEVEH_MODULO_<NOMBRE>=inactivo} apaga un módulo. Sus endpoints responden 503
 * {@code modulo-inactivo} y los demás siguen. El módulo sale del paquete del controlador ({@code co.weveh.<modulo>}).
 * Las cuentas no se apagan: sin ellas no se entra a nada.
 */
@Component
public class InterruptorModulos implements HandlerInterceptor {

    /** Los módulos que se pueden apagar, en el orden en que se muestran en la salud (Actuator). */
    static final List<String> APAGABLES = List.of("catalogo", "garaje", "mecanicoia");

    static final String INACTIVO = "inactivo";
    private static final String PREFIJO_PAQUETE = "co.weveh.";

    private final Environment entorno;

    InterruptorModulos(Environment entorno) {
        this.entorno = entorno;
    }

    @Override
    public boolean preHandle(HttpServletRequest solicitud, HttpServletResponse respuesta, Object manejador) {
        if (manejador instanceof HandlerMethod metodo && moduloDe(metodo.getBeanType()).filter(this::estaInactivo).isPresent()) {
            throw new ModuloInactivoException();
        }
        return true;
    }

    public boolean estaInactivo(String modulo) {
        return APAGABLES.contains(modulo)
                && INACTIVO.equalsIgnoreCase(entorno.getProperty("weveh.modulo." + modulo, "activo").strip());
    }

    /** Para la salud por módulo: cada módulo apagable con "activo" o "inactivo". */
    public Map<String, String> estados() {
        var estados = new TreeMap<String, String>();
        APAGABLES.forEach(modulo -> estados.put(modulo, estaInactivo(modulo) ? INACTIVO : "activo"));
        return estados;
    }

    static Optional<String> moduloDe(Class<?> tipo) {
        var paquete = tipo.getPackageName();
        if (!paquete.startsWith(PREFIJO_PAQUETE)) {
            return Optional.empty();
        }
        var resto = paquete.substring(PREFIJO_PAQUETE.length());
        var punto = resto.indexOf('.');
        return Optional.of(punto < 0 ? resto : resto.substring(0, punto));
    }
}
