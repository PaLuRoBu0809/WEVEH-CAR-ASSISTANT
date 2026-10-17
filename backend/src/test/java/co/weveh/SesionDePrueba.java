package co.weveh;

import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.jwt;

import java.time.Instant;
import org.springframework.test.web.servlet.request.RequestPostProcessor;

/**
 * Simula una sesión de Supabase Auth en las pruebas con MockMvc: un token ya validado con ese {@code sub}. Los casos de
 * token ausente o alterado se prueban sin este ayudante.
 */
public final class SesionDePrueba {

    public static final String CORREO = "persona@correo.com";

    private SesionDePrueba() {
    }

    /** Sesión recién iniciada. */
    public static RequestPostProcessor como(String usuarioId) {
        return comoDesde(usuarioId, Instant.now());
    }

    /** Sesión iniciada en ese momento (para probar acciones que exigen haber entrado hace poco, RF-CTA-05). */
    public static RequestPostProcessor comoDesde(String usuarioId, Instant sesionIniciadaEn) {
        return jwt().jwt(token -> token.subject(usuarioId).claim("email", CORREO).issuedAt(sesionIniciadaEn));
    }
}
