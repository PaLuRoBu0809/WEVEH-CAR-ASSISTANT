package co.weveh.shared.infrastructure.web;

import co.weveh.shared.domain.NoAutenticadoException;
import java.util.LinkedHashMap;
import java.util.List;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.AuthenticationEntryPoint;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
import tools.jackson.databind.json.JsonMapper;

/**
 * Cuentas con Supabase Auth (docs/adr/0005): toda ruta {@code /api/**} exige {@code Authorization: Bearer <token>}.
 * Spring valida la firma con el JWKS del proyecto, el emisor, la audiencia y el vencimiento (application.yml).
 * Sin token, vencido o alterado responde 401 en formato Problem Details.
 */
@Configuration(proxyBeanMethods = false)
public class ConfiguracionSeguridad {

    @Bean
    SecurityFilterChain seguridad(HttpSecurity http, JsonMapper json, CorsConfigurationSource origenesPermitidos)
            throws Exception {
        var sinSesion = respuestaNoAutenticado(json);
        http.csrf(AbstractHttpConfigurer::disable)
                .cors(cors -> cors.configurationSource(origenesPermitidos))
                .sessionManagement(sesion -> sesion.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authorizeHttpRequests(rutas -> rutas
                        .requestMatchers("/actuator/health/**", "/actuator/info").permitAll()
                        .anyRequest().authenticated())
                .oauth2ResourceServer(servidor -> servidor
                        .jwt(Customizer.withDefaults())
                        .authenticationEntryPoint(sinSesion))
                .exceptionHandling(errores -> errores.authenticationEntryPoint(sinSesion));
        return http.build();
    }

    /**
     * @param origenes orígenes de navegador permitidos (WEVEH_CORS_ORIGENES). Vacío por defecto: la app móvil no los
     *                 necesita; solo sirven para probar la app en el navegador del PC durante el desarrollo.
     */
    @Bean
    CorsConfigurationSource origenesPermitidos(@Value("${weveh.cors.origenes:}") List<String> origenes) {
        var fuente = new UrlBasedCorsConfigurationSource();
        var permitidos = origenes.stream().map(String::strip).filter(origen -> !origen.isEmpty()).toList();
        if (permitidos.isEmpty()) {
            return fuente;
        }
        var cors = new CorsConfiguration();
        cors.setAllowedOrigins(permitidos);
        cors.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE"));
        cors.setAllowedHeaders(List.of("Authorization", "Content-Type", "Idempotency-Key"));
        cors.setExposedHeaders(List.of("Location"));
        fuente.registerCorsConfiguration("/api/**", cors);
        return fuente;
    }

    private static AuthenticationEntryPoint respuestaNoAutenticado(JsonMapper json) {
        return (solicitud, respuesta, excepcion) -> {
            var problema = new LinkedHashMap<String, Object>();
            problema.put("type", ManejadorErrores.BASE_TIPOS + "no-autenticado");
            problema.put("title", "Inicia sesión");
            problema.put("status", HttpStatus.UNAUTHORIZED.value());
            problema.put("detail", new NoAutenticadoException().getMessage());
            problema.put("instance", solicitud.getRequestURI());
            respuesta.setStatus(HttpStatus.UNAUTHORIZED.value());
            respuesta.setContentType(MediaType.APPLICATION_PROBLEM_JSON_VALUE);
            respuesta.setCharacterEncoding("UTF-8");
            respuesta.getWriter().write(json.writeValueAsString(problema));
        };
    }
}
