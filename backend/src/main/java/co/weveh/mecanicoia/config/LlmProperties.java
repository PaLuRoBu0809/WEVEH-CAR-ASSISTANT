package co.weveh.mecanicoia.config;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.validation.annotation.Validated;

import jakarta.validation.constraints.NotBlank;

/**
 * Configuracion del proveedor del LLM, leida desde variables de entorno
 * (ver application.yml). Mantenerla tipada y centralizada permite empaquetar
 * el backend en Docker y desplegarlo en la nube sin tocar codigo Java.
 */
@ConfigurationProperties(prefix = "weveh.llm")
@Validated
public class LlmProperties {

    @NotBlank
    private String baseUrl;

    @NotBlank
    private String apiKey;

    @NotBlank
    private String modelo;

    private double temperatura;

    /**
     * Techo de tokens de la respuesta. OpenRouter reserva credito por el maximo
     * teorico del modelo, asi que omitirlo hace fallar la peticion con 402.
     */
    private int maxTokens;

    private long timeoutMs;

    public String getBaseUrl() {
        return baseUrl;
    }

    public void setBaseUrl(String baseUrl) {
        this.baseUrl = baseUrl;
    }

    public String getApiKey() {
        return apiKey;
    }

    public void setApiKey(String apiKey) {
        this.apiKey = apiKey;
    }

    public String getModelo() {
        return modelo;
    }

    public void setModelo(String modelo) {
        this.modelo = modelo;
    }

    public double getTemperatura() {
        return temperatura;
    }

    public void setTemperatura(double temperatura) {
        this.temperatura = temperatura;
    }

    public int getMaxTokens() {
        return maxTokens;
    }

    public void setMaxTokens(int maxTokens) {
        this.maxTokens = maxTokens;
    }

    public long getTimeoutMs() {
        return timeoutMs;
    }

    public void setTimeoutMs(long timeoutMs) {
        this.timeoutMs = timeoutMs;
    }
}
