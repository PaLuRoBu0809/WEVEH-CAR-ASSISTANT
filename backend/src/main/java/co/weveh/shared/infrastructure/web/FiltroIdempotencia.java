package co.weveh.shared.infrastructure.web;

import co.weveh.shared.infrastructure.persistencia.CambiosProcesados;
import co.weveh.shared.infrastructure.persistencia.CambiosProcesados.CambioProcesado;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.filter.OncePerRequestFilter;
import org.springframework.web.util.ContentCachingResponseWrapper;

/**
 * ADR 0009 y RF-GAR-06: un cambio con {@code Idempotency-Key} se aplica una sola vez. Si la misma clave llega otra
 * vez (la app reintenta al volver la red), se responde lo que se respondió la primera vez, sin tocar nada. Solo se
 * guardan las respuestas exitosas: un error no cambió nada y se puede reintentar.
 * Corre después de Spring Security (ConfiguracionIdempotencia): la clave es de cada persona.
 */
class FiltroIdempotencia extends OncePerRequestFilter {

    static final String CABECERA = "Idempotency-Key";
    static final String CABECERA_REPETIDO = "Idempotent-Replayed";

    private static final Logger LOG = LoggerFactory.getLogger(FiltroIdempotencia.class);
    private static final Set<String> METODOS_QUE_CAMBIAN = Set.of("POST", "PUT", "PATCH", "DELETE");

    private final CambiosProcesados cambios;

    FiltroIdempotencia(CambiosProcesados cambios) {
        this.cambios = cambios;
    }

    @Override
    protected boolean shouldNotFilter(HttpServletRequest solicitud) {
        return !METODOS_QUE_CAMBIAN.contains(solicitud.getMethod()) || solicitud.getHeader(CABECERA) == null
                || !solicitud.getRequestURI().startsWith("/api/");
    }

    @Override
    protected void doFilterInternal(HttpServletRequest solicitud, HttpServletResponse respuesta, FilterChain cadena)
            throws ServletException, IOException {
        var usuario = usuarioAutenticado();
        var clave = claveValida(solicitud.getHeader(CABECERA));
        if (usuario.isEmpty() || clave.isEmpty()) {
            cadena.doFilter(solicitud, respuesta);
            return;
        }
        var metodo = solicitud.getMethod();
        var ruta = solicitud.getRequestURI();
        var anterior = cambios.buscar(usuario.get(), clave.get());
        if (anterior.isPresent()) {
            responderOtraVez(anterior.get(), metodo, ruta, respuesta);
            return;
        }
        var envoltura = new ContentCachingResponseWrapper(respuesta);
        cadena.doFilter(solicitud, envoltura);
        if (envoltura.getStatus() >= 200 && envoltura.getStatus() < 300) {
            guardar(usuario.get(), clave.get(), new CambioProcesado(metodo, ruta, envoltura.getStatus(),
                    envoltura.getContentType(), new String(envoltura.getContentAsByteArray(), StandardCharsets.UTF_8)));
        }
        envoltura.copyBodyToResponse();
    }

    private void responderOtraVez(CambioProcesado anterior, String metodo, String ruta, HttpServletResponse respuesta)
            throws IOException {
        if (!anterior.esElMismoCambio(metodo, ruta)) {
            respuesta.setStatus(HttpStatus.UNPROCESSABLE_CONTENT.value());
            respuesta.setContentType(MediaType.APPLICATION_PROBLEM_JSON_VALUE);
            respuesta.getWriter().write("""
                    {"type":"https://weveh.co/problemas/clave-repetida","title":"Clave repetida",\
                    "status":422,"detail":"Esa Idempotency-Key ya se usó para otro cambio"}""");
            return;
        }
        respuesta.setStatus(anterior.estadoHttp());
        respuesta.setHeader(CABECERA_REPETIDO, "true");
        if (anterior.tipoContenido() != null) {
            respuesta.setContentType(anterior.tipoContenido());
        }
        if (anterior.cuerpo() != null && !anterior.cuerpo().isEmpty()) {
            respuesta.setCharacterEncoding(StandardCharsets.UTF_8);
            respuesta.getWriter().write(anterior.cuerpo());
        }
    }

    /** Si no se pudo anotar, el cambio igual quedó hecho: se registra y la respuesta sigue su camino. */
    private void guardar(UUID usuario, UUID clave, CambioProcesado cambio) {
        try {
            cambios.guardar(usuario, clave, cambio);
        } catch (RuntimeException error) {
            LOG.warn("No se pudo anotar el cambio procesado {} {}", cambio.metodo(), cambio.ruta(), error);
        }
    }

    private static Optional<UUID> usuarioAutenticado() {
        var autenticacion = SecurityContextHolder.getContext().getAuthentication();
        if (autenticacion == null || !(autenticacion.getPrincipal() instanceof Jwt token)) {
            return Optional.empty();
        }
        return claveValida(token.getSubject());
    }

    private static Optional<UUID> claveValida(String texto) {
        try {
            return Optional.of(UUID.fromString(texto.strip()));
        } catch (IllegalArgumentException | NullPointerException error) {
            return Optional.empty();
        }
    }
}
