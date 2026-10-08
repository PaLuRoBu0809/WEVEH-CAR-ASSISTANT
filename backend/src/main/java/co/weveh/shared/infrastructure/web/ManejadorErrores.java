package co.weveh.shared.infrastructure.web;

import co.weveh.shared.domain.ConflictoException;
import co.weveh.shared.domain.DatoInvalidoException;
import co.weveh.shared.domain.DispositivoInvalidoException;
import co.weveh.shared.domain.RecursoNoEncontradoException;
import co.weveh.shared.domain.ServicioNoDisponibleException;
import java.net.URI;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.HttpStatusCode;
import org.springframework.http.ProblemDetail;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.context.request.WebRequest;
import org.springframework.web.servlet.mvc.method.annotation.ResponseEntityExceptionHandler;

/**
 * Traduce las excepciones de dominio a Problem Details (RFC 9457). El "detail" es el texto que la app le muestra a la
 * persona: sin jerga.
 */
@RestControllerAdvice
public class ManejadorErrores extends ResponseEntityExceptionHandler {

    static final String BASE_TIPOS = "https://weveh.co/problemas/";

    @ExceptionHandler(DispositivoInvalidoException.class)
    ProblemDetail dispositivoInvalido(DispositivoInvalidoException excepcion) {
        return problema(HttpStatus.BAD_REQUEST, "dispositivo-invalido", "Dispositivo no válido", excepcion.getMessage());
    }

    @ExceptionHandler(DatoInvalidoException.class)
    ProblemDetail datoInvalido(DatoInvalidoException excepcion) {
        return problema(HttpStatus.BAD_REQUEST, "dato-invalido", "Revisa los datos", excepcion.getMessage());
    }

    @ExceptionHandler(RecursoNoEncontradoException.class)
    ProblemDetail noEncontrado(RecursoNoEncontradoException excepcion) {
        return problema(HttpStatus.NOT_FOUND, "no-encontrado", "No encontrado", excepcion.getMessage());
    }

    @ExceptionHandler(ConflictoException.class)
    ProblemDetail conflicto(ConflictoException excepcion) {
        return problema(HttpStatus.CONFLICT, "conflicto", "Los datos cambiaron", excepcion.getMessage());
    }

    @ExceptionHandler(ServicioNoDisponibleException.class)
    ProblemDetail noDisponible(ServicioNoDisponibleException excepcion) {
        return problema(HttpStatus.SERVICE_UNAVAILABLE, "no-disponible", "Servicio no disponible", excepcion.getMessage());
    }

    @Override
    protected ResponseEntity<Object> handleMethodArgumentNotValid(MethodArgumentNotValidException excepcion,
                                                                  HttpHeaders headers, HttpStatusCode estado,
                                                                  WebRequest solicitud) {
        var campo = excepcion.getBindingResult().getFieldErrors().stream()
                .map(error -> error.getField())
                .findFirst()
                .orElse("un dato");
        var detalle = "Falta o no es válido: " + campo;
        return ResponseEntity.badRequest().body(problema(HttpStatus.BAD_REQUEST, "dato-invalido", "Revisa los datos", detalle));
    }

    @Override
    protected ResponseEntity<Object> handleHttpMessageNotReadable(HttpMessageNotReadableException excepcion,
                                                                  HttpHeaders headers, HttpStatusCode estado,
                                                                  WebRequest solicitud) {
        var detalle = "Algún dato no tiene el formato esperado (fechas AAAA-MM-DD, números sin puntos)";
        return ResponseEntity.badRequest().body(problema(HttpStatus.BAD_REQUEST, "dato-invalido", "Revisa los datos", detalle));
    }

    static ProblemDetail problema(HttpStatus estado, String tipo, String titulo, String detalle) {
        var problema = ProblemDetail.forStatusAndDetail(estado, detalle);
        problema.setType(URI.create(BASE_TIPOS + tipo));
        problema.setTitle(titulo);
        return problema;
    }
}
