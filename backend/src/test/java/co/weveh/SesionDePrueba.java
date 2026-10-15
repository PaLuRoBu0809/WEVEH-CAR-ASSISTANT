package co.weveh;

import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.jwt;

import org.springframework.test.web.servlet.request.RequestPostProcessor;

/**
 * Simula una sesión de Supabase Auth en las pruebas con MockMvc: un token ya validado con ese {@code sub}. Los casos de
 * token ausente o alterado se prueban sin este ayudante.
 */
public final class SesionDePrueba {

    public static final String CORREO = "persona@correo.com";

    private SesionDePrueba() {
    }

    public static RequestPostProcessor como(String usuarioId) {
        return jwt().jwt(token -> token.subject(usuarioId).claim("email", CORREO));
    }
}
