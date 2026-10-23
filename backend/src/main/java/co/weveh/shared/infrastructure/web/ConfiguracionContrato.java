package co.weveh.shared.infrastructure.web;

import io.swagger.v3.oas.models.Components;
import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.security.SecurityRequirement;
import io.swagger.v3.oas.models.security.SecurityScheme;
import io.swagger.v3.oas.models.servers.Server;
import java.util.List;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/** ADR 0012: encabezado del contrato OpenAPI que se genera del código (contracts/openapi.yaml). */
@Configuration(proxyBeanMethods = false)
class ConfiguracionContrato {

    static final String SESION = "supabase";

    @Bean
    OpenAPI contratoWeveh() {
        return new OpenAPI()
                .info(new Info()
                        .title("WEVEH API")
                        .version("0.1.0")
                        .description("""
                                API del MVP de WEVEH (docs/api.md). Todas las rutas bajo /api exigen
                                Authorization: Bearer <token de Supabase Auth> (ADR 0005). Los errores siguen Problem
                                Details (RFC 9457). Este contrato se genera del código: no se edita a mano."""))
                .servers(List.of(new Server().url("https://weveh-backend.onrender.com").description("Render")))
                .components(new Components().addSecuritySchemes(SESION,
                        new SecurityScheme().type(SecurityScheme.Type.HTTP).scheme("bearer").bearerFormat("JWT")))
                .addSecurityItem(new SecurityRequirement().addList(SESION));
    }
}
