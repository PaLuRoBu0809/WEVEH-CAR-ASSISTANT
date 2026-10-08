package co.weveh.shared.infrastructure.web;

import java.util.List;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.method.support.HandlerMethodArgumentResolver;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.InterceptorRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration(proxyBeanMethods = false)
public class ConfiguracionWeb implements WebMvcConfigurer {

    private final List<String> origenesCors;

    /**
     * @param origenesCors orígenes de navegador permitidos (WEVEH_CORS_ORIGENES). Vacío por defecto: la app móvil no
     *                     los necesita; solo sirven para probar la app en el navegador del PC durante el desarrollo.
     */
    public ConfiguracionWeb(@Value("${weveh.cors.origenes:}") List<String> origenesCors) {
        this.origenesCors = origenesCors.stream().map(String::strip).filter(origen -> !origen.isEmpty()).toList();
    }

    @Override
    public void addInterceptors(InterceptorRegistry registry) {
        registry.addInterceptor(new FiltroDispositivo()).addPathPatterns("/api/**");
    }

    @Override
    public void addArgumentResolvers(List<HandlerMethodArgumentResolver> resolvers) {
        resolvers.add(new ResolvedorDispositivoId());
    }

    @Override
    public void addCorsMappings(CorsRegistry registry) {
        if (origenesCors.isEmpty()) {
            return;
        }
        registry.addMapping("/api/**")
                .allowedOrigins(origenesCors.toArray(String[]::new))
                .allowedMethods("GET", "POST", "PUT", "DELETE")
                .allowedHeaders(FiltroDispositivo.HEADER, "Content-Type", "Idempotency-Key")
                .exposedHeaders("Location");
    }
}
