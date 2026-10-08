package co.weveh.shared.infrastructure.web;

import co.weveh.shared.domain.DispositivoInvalidoException;
import java.net.URI;
import org.springframework.http.HttpStatus;
import org.springframework.http.ProblemDetail;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.servlet.mvc.method.annotation.ResponseEntityExceptionHandler;

/**
 * Traduce las excepciones de dominio a Problem Details (RFC 9457).
 */
@RestControllerAdvice
public class ManejadorErrores extends ResponseEntityExceptionHandler {

    static final String BASE_TIPOS = "https://weveh.co/problemas/";

    @ExceptionHandler(DispositivoInvalidoException.class)
    ProblemDetail dispositivoInvalido(DispositivoInvalidoException excepcion) {
        return problema(HttpStatus.BAD_REQUEST, "dispositivo-invalido", "Dispositivo no válido", excepcion.getMessage());
    }

    static ProblemDetail problema(HttpStatus estado, String tipo, String titulo, String detalle) {
        var problema = ProblemDetail.forStatusAndDetail(estado, detalle);
        problema.setType(URI.create(BASE_TIPOS + tipo));
        problema.setTitle(titulo);
        return problema;
    }
}
