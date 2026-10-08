# Implementación de referencia (Anthropic Java SDK)

Dependencia Maven (verifica la última versión en Maven Central antes de fijarla):

```xml
<dependency>
  <groupId>com.anthropic</groupId>
  <artifactId>anthropic-java</artifactId>
  <version>2.34.0</version>
</dependency>
```

Variables de entorno: `ANTHROPIC_API_KEY`, `WEVEH_IA_MODELO` (por defecto `claude-opus-5-5`).

Antes de escribir código nuevo contra el SDK, carga la skill `claude-api` de Claude Code: tiene los nombres exactos de clases y los cambios recientes de la API. No adivines firmas.

## Cliente (bean único)

```java
// perfilamiento/infrastructure/ia/ConfiguracionClienteAnthropic.java
@Bean
AnthropicClient clienteAnthropic() {
    return AnthropicOkHttpClient.fromEnv();   // lee ANTHROPIC_API_KEY
}
```

## Fase A: investigación con búsqueda web

```java
import com.anthropic.models.messages.MessageCreateParams;
import com.anthropic.models.messages.OutputConfig;
import com.anthropic.models.messages.Tool;
import com.anthropic.models.messages.WebSearchTool20260209;

MessageCreateParams solicitud = MessageCreateParams.builder()
    .model(propiedades.modelo())                       // "claude-opus-5-5"
    .maxTokens(16000L)
    .outputConfig(OutputConfig.builder().effort(OutputConfig.Effort.MEDIUM).build())
    .system(promptInvestigador)                        // cargado de resources/prompts/perfilamiento/investigador-v1.md
    .addTool(WebSearchTool20260209.builder().maxUses(6L).build())
    .addTool(herramientaGuardarFicha)                  // Tool con strict = true y el esquema esquema-ficha.json
    .addUserMessage(descripcionVehiculo)               // marca, línea, versión, año, motor. Sin placa.
    .build();
```

Bucle manual mínimo:
1. Llama `client.messages().create(solicitud)`.
2. Si `stopReason` es `pause_turn`, agrega el `content` de la respuesta como mensaje `assistant` y vuelve a llamar.
3. Si hay un bloque `tool_use` con nombre `guardar_ficha_tecnica`, parsea su `input` con Jackson, valídalo contra el esquema, guárdalo y responde con un `tool_result` ("guardado"). Termina.
4. Si termina en `end_turn` sin llamar la herramienta, reintenta una vez con un mensaje de usuario recordándolo; si vuelve a fallar, guarda la ficha vacía (`intervalos = []`) y usa el plan genérico.
5. Revisa `stopReason == refusal` antes de leer el contenido.

## Fase B: un turno de entrevista con salida estructurada

```java
record Registro(String tipo, String pieza, Integer km, String fecha, String descripcion, String certeza) {}
record Pregunta(String texto, String motivo, List<String> opciones, boolean permite_texto) {}
record TurnoEntrevista(List<Registro> registros, Pregunta siguiente_pregunta,
                       double progreso, boolean sintoma_critico_detectado) {}

StructuredMessageCreateParams<TurnoEntrevista> turno = MessageCreateParams.builder()
    .model(propiedades.modelo())
    .maxTokens(4000L)
    .outputConfig(TurnoEntrevista.class)
    .system(promptEntrevistador + fichaTecnicaJson + perfilVehiculoJson)  // parte estable primero (caché)
    .messages(historialDeTurnos)                                         // solo se agregan mensajes, nunca se editan
    .addUserMessage(respuestaUsuario)
    .build();

TurnoEntrevista resultado = client.messages().create(turno).content().stream()
    .flatMap(bloque -> bloque.text().stream())
    .map(texto -> texto.text())
    .findFirst()
    .orElseThrow(RespuestaIaInvalidaException::new);
```

Después de cada turno:
- Si `sintoma_critico_detectado` es verdadero o el validador de seguridad detecta palabras críticas en la respuesta del usuario, cierra la sesión y devuelve la recomendación de seguridad.
- Agrega `registros` a `propuestos` (no a las tablas finales).
- El historial es de solo agregar: no reescribas turnos anteriores, eso invalida la caché y el razonamiento guardado.
