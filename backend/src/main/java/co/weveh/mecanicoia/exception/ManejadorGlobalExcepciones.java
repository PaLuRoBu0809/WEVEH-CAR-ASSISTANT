package co.weveh.mecanicoia.exception;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

/**
 * Centraliza la traduccion de excepciones a respuestas HTTP. El DiagnosticoController
 * no hace try/catch: cada capa lanza la excepcion especifica y este componente decide
 * el status code, para que el frontend siempre reciba un ErrorRespuestaDto predecible.
 */
@RestControllerAdvice
public class ManejadorGlobalExcepciones {

    private static final Logger log = LoggerFactory.getLogger(ManejadorGlobalExcepciones.class);

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ErrorRespuestaDto> manejarValidacion(MethodArgumentNotValidException excepcion) {
        String mensaje = excepcion.getBindingResult().getFieldErrors().stream()
                .findFirst()
                .map(error -> error.getField() + ": " + error.getDefaultMessage())
                .orElse("La solicitud no cumple el formato esperado");
        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(new ErrorRespuestaDto("SOLICITUD_INVALIDA", mensaje));
    }

    @ExceptionHandler(LlmIndisponibleException.class)
    public ResponseEntity<ErrorRespuestaDto> manejarLlmIndisponible(LlmIndisponibleException excepcion) {
        log.warn("El proveedor del LLM no respondio: {}", excepcion.getMessage(), excepcion);
        return ResponseEntity.status(HttpStatus.BAD_GATEWAY)
                .body(new ErrorRespuestaDto("LLM_INDISPONIBLE",
                        "El Mecanico IA no esta disponible en este momento. Intenta de nuevo en unos minutos."));
    }

    @ExceptionHandler(RespuestaLlmInvalidaException.class)
    public ResponseEntity<ErrorRespuestaDto> manejarRespuestaInvalida(RespuestaLlmInvalidaException excepcion) {
        log.warn("El LLM devolvio una respuesta invalida: {}", excepcion.getMessage(), excepcion);
        return ResponseEntity.status(HttpStatus.BAD_GATEWAY)
                .body(new ErrorRespuestaDto("RESPUESTA_LLM_INVALIDA",
                        "El Mecanico IA no pudo generar un diagnostico valido. Intenta reformular el sintoma."));
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ErrorRespuestaDto> manejarErrorInesperado(Exception excepcion) {
        log.error("Error inesperado", excepcion);
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(new ErrorRespuestaDto("ERROR_INTERNO", "Ocurrio un error inesperado."));
    }
}
