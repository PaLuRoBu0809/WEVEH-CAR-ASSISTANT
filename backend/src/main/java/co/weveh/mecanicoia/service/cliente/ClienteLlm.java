package co.weveh.mecanicoia.service.cliente;

import co.weveh.mecanicoia.exception.LlmIndisponibleException;

/**
 * Abstraccion del proveedor de LLM. AgenteMecanicoService depende solo de esta
 * interfaz (nunca de WebClient directamente) para poder mockearla en tests sin
 * red real y para poder cambiar de proveedor sin tocar la capa de orquestacion.
 */
public interface ClienteLlm {

    /**
     * @return el contenido de texto crudo devuelto por el modelo (puede venir
     *         envuelto en fences ```json```; la limpieza es responsabilidad de
     *         quien consume este metodo).
     * @throws LlmIndisponibleException si falla la llamada por red, timeout o rate limit.
     */
    String obtenerDiagnosticoCrudo(String promptSistema, String payloadUsuarioJson);
}
