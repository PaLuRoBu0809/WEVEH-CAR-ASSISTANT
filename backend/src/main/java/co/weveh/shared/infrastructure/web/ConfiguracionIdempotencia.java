package co.weveh.shared.infrastructure.web;

import co.weveh.shared.infrastructure.persistencia.CambiosProcesados;
import org.springframework.boot.web.servlet.FilterRegistrationBean;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * Registra el filtro de Idempotency-Key después de Spring Security (orden -100), para que ya sepa quién es la
 * persona. Va en una configuración y no como @Component para que las pruebas @WebMvcTest no lo carguen.
 */
@Configuration(proxyBeanMethods = false)
class ConfiguracionIdempotencia {

    static final int ORDEN_DESPUES_DE_SEGURIDAD = 0;

    @Bean
    FilterRegistrationBean<FiltroIdempotencia> filtroIdempotencia(CambiosProcesados cambios) {
        var registro = new FilterRegistrationBean<>(new FiltroIdempotencia(cambios));
        registro.addUrlPatterns("/api/*");
        registro.setOrder(ORDEN_DESPUES_DE_SEGURIDAD);
        return registro;
    }
}
