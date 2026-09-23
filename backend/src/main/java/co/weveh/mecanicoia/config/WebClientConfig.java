package co.weveh.mecanicoia.config;

import io.netty.channel.ChannelOption;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpHeaders;
import org.springframework.http.client.reactive.ReactorClientHttpConnector;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.netty.http.client.HttpClient;

/**
 * Unico lugar del proyecto que sabe que existe WebClient: el resto del codigo
 * (AgenteMecanicoService) solo conoce la interfaz ClienteLlm, nunca esta clase.
 */
@Configuration
public class WebClientConfig {

    @Bean
    public WebClient clienteWebClientLlm(LlmProperties propiedades) {
        HttpClient httpClient = HttpClient.create()
                .option(ChannelOption.CONNECT_TIMEOUT_MILLIS, (int) propiedades.getTimeoutMs());

        return WebClient.builder()
                .baseUrl(propiedades.getBaseUrl())
                .clientConnector(new ReactorClientHttpConnector(httpClient))
                .defaultHeader(HttpHeaders.AUTHORIZATION, "Bearer " + propiedades.getApiKey())
                .defaultHeader(HttpHeaders.CONTENT_TYPE, "application/json")
                .build();
    }
}
