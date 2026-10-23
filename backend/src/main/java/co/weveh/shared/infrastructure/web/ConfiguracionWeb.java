package co.weveh.shared.infrastructure.web;

import java.util.List;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.method.support.HandlerMethodArgumentResolver;
import org.springframework.web.servlet.config.annotation.InterceptorRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

/**
 * Los controladores reciben el {@code UsuarioId} como parámetro, y cada petición pasa por el interruptor de su
 * módulo (ADR 0010). CORS y autenticación: {@link ConfiguracionSeguridad}.
 */
@Configuration(proxyBeanMethods = false)
public class ConfiguracionWeb implements WebMvcConfigurer {

    private final InterruptorModulos interruptor;

    ConfiguracionWeb(InterruptorModulos interruptor) {
        this.interruptor = interruptor;
    }

    @Override
    public void addInterceptors(InterceptorRegistry registro) {
        registro.addInterceptor(interruptor).addPathPatterns("/api/**");
    }

    @Override
    public void addArgumentResolvers(List<HandlerMethodArgumentResolver> resolvers) {
        resolvers.add(new ResolvedorUsuarioId());
    }
}
