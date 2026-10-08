package co.weveh.shared.infrastructure.web;

import co.weveh.shared.domain.DispositivoId;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.web.servlet.HandlerInterceptor;

/**
 * Exige el header {@value #HEADER} en toda ruta {@code /api/**} y deja el {@link DispositivoId} en la petición.
 * Es un interceptor (no un filtro de servlet) para que el error pase por {@link ManejadorErrores} y salga como Problem Details.
 */
public class FiltroDispositivo implements HandlerInterceptor {

    public static final String HEADER = "X-Weveh-Dispositivo";
    static final String ATRIBUTO = DispositivoId.class.getName();

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) {
        request.setAttribute(ATRIBUTO, DispositivoId.desdeTexto(request.getHeader(HEADER)));
        return true;
    }
}
