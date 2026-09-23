package co.weveh.mecanicoia.dto.llm;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

import java.util.List;

/**
 * Modela el sobre de la respuesta de la API chat/completions de OpenRouter
 * (compatible con el formato de OpenAI). Separa el "sobre" del transporte del
 * contenido de negocio: AgenteMecanicoService solo necesita el content interno.
 */
@JsonIgnoreProperties(ignoreUnknown = true)
public class OpenRouterChatResponseDto {

    private List<Choice> choices;

    public List<Choice> getChoices() {
        return choices;
    }

    public void setChoices(List<Choice> choices) {
        this.choices = choices;
    }

    public String contenidoDelPrimerChoice() {
        if (choices == null || choices.isEmpty() || choices.get(0).getMessage() == null) {
            return null;
        }
        return choices.get(0).getMessage().getContent();
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class Choice {
        private Message message;

        public Message getMessage() {
            return message;
        }

        public void setMessage(Message message) {
            this.message = message;
        }
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class Message {
        private String content;

        public String getContent() {
            return content;
        }

        public void setContent(String content) {
            this.content = content;
        }
    }
}
