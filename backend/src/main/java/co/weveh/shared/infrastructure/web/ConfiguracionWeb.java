package co.weveh.shared.infrastructure.web;

import java.util.List;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.method.support.HandlerMethodArgumentResolver;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

/** Los controladores reciben el {@code UsuarioId} como parámetro. CORS y autenticación: {@link ConfiguracionSeguridad}. */
@Configuration(proxyBeanMethods = false)
public class ConfiguracionWeb implements WebMvcConfigurer {

    @Override
    public void addArgumentResolvers(List<HandlerMethodArgumentResolver> resolvers) {
        resolvers.add(new ResolvedorUsuarioId());
    }
}
