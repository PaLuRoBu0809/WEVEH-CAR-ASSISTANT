package co.weveh.mecanicoia.service.cliente;

import co.weveh.mecanicoia.config.LlmProperties;
import co.weveh.mecanicoia.dto.llm.OpenRouterChatResponseDto;
import co.weveh.mecanicoia.exception.LlmIndisponibleException;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.reactive.function.client.WebClientException;

import java.time.Duration;
import java.util.List;
import java.util.Map;
import java.util.concurrent.TimeoutException;

/**
 * Implementacion de ClienteLlm que llama al endpoint chat/completions de
 * OpenRouter (compatible con el formato de OpenAI), tal como lo hacia el
 * notebook. Envuelve cualquier fallo de red/timeout/rate-limit en
 * LlmIndisponibleException para que el resto de capas nunca vea tipos de WebFlux.
 */
@Component
public class ClienteLlmOpenRouter implements ClienteLlm {

    private final WebClient webClient;
    private final LlmProperties propiedades;

    public ClienteLlmOpenRouter(WebClient clienteWebClientLlm, LlmProperties propiedades) {
        this.webClient = clienteWebClientLlm;
        this.propiedades = propiedades;
    }

    @Override
    public String obtenerDiagnosticoCrudo(String promptSistema, String payloadUsuarioJson) {
        Map<String, Object> cuerpoRequest = Map.of(
                "model", propiedades.getModelo(),
                "temperature", propiedades.getTemperatura(),
                "response_format", Map.of("type", "json_object"),
                "messages", List.of(
                        Map.of("role", "system", "content", promptSistema),
                        Map.of("role", "user", "content", payloadUsuarioJson)
                )
        );

        try {
            OpenRouterChatResponseDto respuesta = webClient.post()
                    .uri("/chat/completions")
                    .bodyValue(cuerpoRequest)
                    .retrieve()
                    .bodyToMono(OpenRouterChatResponseDto.class)
                    .block(Duration.ofMillis(propiedades.getTimeoutMs()));

            if (respuesta == null || respuesta.contenidoDelPrimerChoice() == null) {
                throw new LlmIndisponibleException("El proveedor del LLM devolvio una respuesta vacia");
            }
            return respuesta.contenidoDelPrimerChoice();

        } catch (LlmIndisponibleException excepcion) {
            throw excepcion;
        } catch (WebClientException | IllegalStateException excepcion) {
            throw new LlmIndisponibleException("Fallo la llamada al proveedor del LLM", excepcion);
        } catch (RuntimeException excepcion) {
            if (excepcion.getCause() instanceof TimeoutException) {
                throw new LlmIndisponibleException("Se agoto el tiempo de espera del proveedor del LLM", excepcion);
            }
            throw new LlmIndisponibleException("Fallo inesperado al llamar al proveedor del LLM", excepcion);
        }
    }
}
