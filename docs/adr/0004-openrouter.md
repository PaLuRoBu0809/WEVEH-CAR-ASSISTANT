# ADR 0004 — OpenRouter como proveedor de IA

- **Estado:** aceptada (reemplaza la fila "IA" del ADR 0001)
- **Fecha:** 2026-10-08
- **Autores:** Isaac Cano, Pablo Rodríguez

## Contexto

El ADR 0001 fijó el Anthropic Java SDK para los agentes de IA. El equipo decidió adelantar el Mecánico IA a la fase 1 y usar **OpenRouter**, que da una sola llave y una sola API (compatible con OpenAI) para modelos de varios proveedores, incluido Claude. Así se puede cambiar de modelo por costo o calidad sin tocar código.

## Decisión

- El adaptador `MotorDiagnosticoOpenRouter` (`mecanicoia/infrastructure/ia`) llama a `POST https://openrouter.ai/api/v1/chat/completions` con `RestClient` de Spring; no hay SDK de un proveedor.
- Modelo configurable por `WEVEH_IA_MODELO` con el identificador de OpenRouter (por ejemplo `anthropic/claude-sonnet-4.5`). Llave en `OPENROUTER_API_KEY`, solo en el backend.
- Salida estructurada con `response_format: json_schema` (`strict`) y el esquema del contrato `diagnostico_mecanico_preventivo`. Aun así el backend valida la respuesta; si no cumple, un reintento y luego la respuesta segura.
- `finish_reason` distinto de `stop` (corte por longitud, filtro de contenido) se trata como respuesta inválida: nunca un diagnóstico a medias.
- Las reglas de IA de `CLAUDE.md` no cambian: puerto `MotorDiagnostico`, `ValidadorSeguridadDiagnostico` en código y después del modelo, sin placa ni dispositivo en el contexto, prompt versionado (`prompts/mecanico-v1.md`) guardado con cada consulta.

## Alternativas consideradas

- **Anthropic Java SDK directo** (ADR 0001): acceso a funciones propias como la búsqueda web de servidor, pero ata el código a un proveedor.
- **Spring AI**: abstracción más grande de lo que el MVP necesita.

## Consecuencias

- No todos los modelos de OpenRouter soportan `json_schema`; el adaptador acepta también JSON entre cercas de markdown y valida igual.
- El agente "Completar perfil" (fase 4) necesitará un modelo con búsqueda web en OpenRouter (por ejemplo el sufijo `:online`); se decide en su fase.
- Cambiar de modelo exige correr los evals (`evals/mecanico-ia`) y actualizar `evals/results.md`.
