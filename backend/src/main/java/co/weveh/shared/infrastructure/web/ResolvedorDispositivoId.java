package co.weveh.shared.infrastructure.web;

import co.weveh.shared.domain.DispositivoId;
import org.springframework.core.MethodParameter;
import org.springframework.web.bind.support.WebDataBinderFactory;
import org.springframework.web.context.request.NativeWebRequest;
import org.springframework.web.context.request.RequestAttributes;
import org.springframework.web.method.support.HandlerMethodArgumentResolver;
import org.springframework.web.method.support.ModelAndViewContainer;

/**
 * Permite declarar {@code DispositivoId dispositivo} como parámetro de un controlador.
 */
public class ResolvedorDispositivoId implements HandlerMethodArgumentResolver {

    @Override
    public boolean supportsParameter(MethodParameter parameter) {
        return DispositivoId.class.equals(parameter.getParameterType());
    }

    @Override
    public DispositivoId resolveArgument(MethodParameter parameter, ModelAndViewContainer mavContainer,
                                         NativeWebRequest webRequest, WebDataBinderFactory binderFactory) {
        var dispositivo = webRequest.getAttribute(FiltroDispositivo.ATRIBUTO, RequestAttributes.SCOPE_REQUEST);
        if (dispositivo instanceof DispositivoId id) {
            return id;
        }
        return DispositivoId.desdeTexto(webRequest.getHeader(FiltroDispositivo.HEADER));
    }
}
