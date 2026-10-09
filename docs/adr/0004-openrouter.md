# ADR 0004 — OpenRouter como proveedor de IA

- **Estado:** aceptada (reemplaza la fila "IA" del ADR 0001)
- **Fecha:** 2026-10-08
- **Autores:** Isaac Cano, Pablo Rodríguez

## Contexto

El ADR 0001 fijó el Anthropic Java SDK para los agentes de IA. El equipo decidió adelantar el Mecánico IA a la fase 1, usar **OpenRouter** (una sola llave y una sola API compatible con OpenAI) y trabajar **solo con modelos gratuitos** (sufijo `:free`) del plan gratis. No se usan modelos de pago.

## Decisión

- El adaptador `MotorDiagnosticoOpenRouter` (`mecanicoia/infrastructure/ia`) llama a `POST https://openrouter.ai/api/v1/chat/completions` con `RestClient` de Spring; no hay SDK de un proveedor.
- `WEVEH_IA_MODELO` es una lista de modelos `:free` en orden de preferencia (por defecto `nvidia/nemotron-3-super-120b-a12b:free`, `google/gemma-4-31b-it:free`, `google/gemma-4-26b-a4b-it:free`, `dots-studio/dots-3-note-preview:free`). Si uno está saturado (429), falla, no acepta el esquema o devuelve algo inválido, se prueba el siguiente, con un máximo de 45 s. Llave en `OPENROUTER_API_KEY`, solo en el backend.
- El catálogo `:free` de OpenRouter cambia con el tiempo: si aparecen 404 "not a valid model", refrescar la lista con `GET https://openrouter.ai/api/v1/models` filtrando `:free` y `structured_outputs`.
- Salida estructurada con `response_format: json_schema` (`strict`) y el esquema del contrato `diagnostico_mecanico_preventivo`. Aun así el backend valida la respuesta; si no cumple, un reintento y luego la respuesta segura.
- `finish_reason` distinto de `stop` (corte por longitud, filtro de contenido) se trata como respuesta inválida: nunca un diagnóstico a medias.
- Las reglas de IA de `CLAUDE.md` no cambian: puerto `MotorDiagnostico`, `ValidadorSeguridadDiagnostico` en código y después del modelo, sin placa ni dispositivo en el contexto, prompt versionado (`prompts/mecanico-v1.md`) guardado con cada consulta.

## Alternativas consideradas

- **Anthropic Java SDK directo** (ADR 0001): funciones propias como la búsqueda web de servidor, pero de pago y atado a un proveedor.
- **Modelos de pago en OpenRouter**: más rápidos y estables, pero el equipo decidió no incurrir en costos en el MVP.
- **Spring AI**: abstracción más grande de lo que el MVP necesita.

## Consecuencias

- No todos los modelos de OpenRouter soportan `json_schema`; el adaptador acepta también JSON entre cercas de markdown y valida igual.
- Los modelos gratis tienen límites de uso por cuenta y latencia variable (en la primera prueba, 27 s; RNF-02 pide < 20 s).
- El agente "Completar perfil" (fase 4) necesita búsqueda web; con modelos gratuitos habrá que resolverla de otra forma (por ejemplo una búsqueda propia en el backend). Se decide en su fase.
- Cambiar de modelo exige correr los evals (`evals/mecanico-ia`) y actualizar `evals/results.md`.
