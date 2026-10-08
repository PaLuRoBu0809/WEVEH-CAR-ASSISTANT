package co.weveh.shared.infrastructure;

import java.time.Clock;
import java.time.ZoneId;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * Un solo reloj para toda la API: las reglas de fechas (vencimientos, "no puede ser futura") usan la hora de Colombia
 * y las pruebas lo pueden fijar.
 */
@Configuration(proxyBeanMethods = false)
class ConfiguracionReloj {

    static final ZoneId COLOMBIA = ZoneId.of("America/Bogota");

    @Bean
    Clock reloj() {
        return Clock.system(COLOMBIA);
    }
}
