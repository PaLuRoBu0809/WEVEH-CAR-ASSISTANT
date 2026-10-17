package co.weveh.shared.infrastructure.web;

import co.weveh.shared.domain.NoAutenticadoException;
import co.weveh.shared.domain.UsuarioId;
import org.springframework.core.MethodParameter;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;
import org.springframework.web.bind.support.WebDataBinderFactory;
import org.springframework.web.context.request.NativeWebRequest;
import org.springframework.web.method.support.HandlerMethodArgumentResolver;
import org.springframework.web.method.support.ModelAndViewContainer;

/**
 * Permite declarar {@code UsuarioId usuario} como parámetro de un controlador. Sale del token ya validado por
 * {@link ConfiguracionSeguridad}.
 */
public class ResolvedorUsuarioId implements HandlerMethodArgumentResolver {

    @Override
    public boolean supportsParameter(MethodParameter parameter) {
        return UsuarioId.class.equals(parameter.getParameterType());
    }

    @Override
    public UsuarioId resolveArgument(MethodParameter parameter, ModelAndViewContainer mavContainer,
                                     NativeWebRequest webRequest, WebDataBinderFactory binderFactory) {
        if (SecurityContextHolder.getContext().getAuthentication() instanceof JwtAuthenticationToken token) {
            return UsuarioId.desdeTexto(token.getToken().getSubject());
        }
        throw new NoAutenticadoException();
    }
}
