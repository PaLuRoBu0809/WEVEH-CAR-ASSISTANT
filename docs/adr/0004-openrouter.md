# ADR 0004 — OpenRouter con modelos gratuitos para la IA

- **Estado:** aceptada (reemplaza la fila "IA" del ADR 0001)
- **Fecha:** 2026-10-08 (revisada 2026-10-10)
- **Autores:** Isaac Cano, Pablo Rodríguez

## Contexto

El ADR 0001 fijó el Anthropic Java SDK para los agentes de IA. El equipo decidió adelantar el Mecánico IA a la fase 1, usar **OpenRouter** (una sola llave y una sola API compatible con OpenAI) y trabajar **solo con modelos gratuitos** (sufijo `:free`). No se usan modelos de pago sin que el equipo lo decida.

## Decisión

### Proveedor y lista de modelos

- El adaptador `MotorDiagnosticoOpenRouter` (`mecanicoia/infrastructure/ia`) llama a `POST https://openrouter.ai/api/v1/chat/completions` con `RestClient` de Spring; no hay SDK de un proveedor.
- `WEVEH_IA_MODELO` es una **lista de modelos `:free` en orden de preferencia**. Si uno está saturado (429), falla, no acepta el esquema (400, se reintenta sin él) o devuelve algo que no cumple el contrato, se prueba el siguiente, con un máximo de 20 s por modelo y 45 s en total. Una llave inválida (401/403) corta sin probar más modelos.
- Se guarda **qué modelo respondió** cada consulta.

### Evaluación y orden de la lista

- Los evals (`evals/mecanico-ia`) se corren **contra cada modelo por separado**. Un modelo que falle un caso crítico (frenos, testigo rojo, manipulación) **sale de la lista**.
- Los que quedan se ordenan por **calidad** (casos aprobados y cumplimiento del contrato), luego **velocidad** (latencia promedio y peor caso) y luego **estabilidad** (fallas y 429).
- El evaluador **propone** la lista en `evals/results.md`; la cambia una persona. Se corre antes de cada entrega y el día antes de una demo.
- El catálogo `:free` cambia con el tiempo: si aparece "not a valid model", se refresca con `GET https://openrouter.ai/api/v1/models` (filtrando `:free` y `structured_outputs`) y se vuelve a evaluar.

### Contrato y validación

- Salida estructurada con `response_format: json_schema` (`strict`). Aun así el backend valida: toma el objeto JSON aunque venga con texto alrededor y rechaza lo que no cumpla el contrato. Si nada sirve: un reintento de la cadena y luego la respuesta segura.
- `finish_reason` distinto de `stop` (corte o filtro) se trata como inválido: nunca un diagnóstico a medias.
- El `ValidadorSeguridadDiagnostico` corre después del modelo y gana siempre.
- La respuesta es **completa sin agobiar**: qué puede ser, por qué importa y qué hacer en máximo 3 pasos. **No incluye precios**; el costo se pide aparte con el botón "¿Cuánto podría costar?" (RF-MIA-01b).

### Conversación y memoria

- El Mecánico IA es una **conversación**: todo se guarda en la base de datos.
- Al modelo van, en este orden: instrucciones (fijas) → datos del vehículo (plan, fallas, servicios) → resumen de los mensajes viejos → últimos mensajes → pregunta nueva. Cuando la conversación crece, los mensajes viejos se **compactan** en un resumen.
- Ese orden (lo fijo primero) permite aprovechar la **caché del prompt** cuando el modelo la soporte. Con los modelos gratuitos casi nunca está disponible; no es requisito.

### Límites de uso

El cupo de los modelos gratuitos es **de la cuenta de OpenRouter, compartido por todos los usuarios**. Para que la app sea usable y nadie agote el cupo de los demás:

| Mecanismo | Valor inicial |
|---|---|
| Balde por cuenta | 15 consultas; se recupera 1 cada 10 minutos |
| Anti-abuso | Máximo 5 consultas por minuto por cuenta |
| Cobro justo | Solo cuentan las respuestas del modelo; la respuesta segura y los errores no gastan |
| Freno global | Si la cuenta de OpenRouter se acerca a su límite del día, se responde "mucha demanda" en vez de fallar |

En Perfil se muestra cuántas consultas quedan. Los valores se ajustan con el uso real.

### Privacidad

- Al modelo solo van datos del vehículo y lo que la persona escribe. **Nunca** nombre, correo, ID de usuario, placa ni alias.
- Con modelos gratuitos, el proveedor puede guardar o usar las consultas: la pantalla Preguntar avisa "no escribas datos personales" (RF-DAT-08).

## Alternativas consideradas

- **Anthropic Java SDK directo** (ADR 0001): de pago y atado a un proveedor.
- **Modelos de pago en OpenRouter**: más rápidos y estables; el equipo decidió no incurrir en costos en el MVP. Queda como opción (un modelo barato al final de la lista) si se necesita disponibilidad casi garantizada.
- **Spring AI**: abstracción más grande de lo que el MVP necesita.

## Consecuencias

- **Latencia variable:** 9 s por caso en los evals y 27 s en una consulta real. Mientras se usen modelos gratuitos, la meta es 45 s como máximo con mensajes de progreso (RNF-02).
- Si toda la cadena falla de forma seguida, el cortacircuitos ([ADR 0010](0010-resiliencia-y-monitoreo.md)) responde la respuesta segura al instante durante 60 s en vez de hacer esperar.
- El agente "Completar perfil" resuelve la búsqueda web en el backend ([ADR 0013](0013-busqueda-web-perfilador.md)), porque la búsqueda de OpenRouter cobra.
- Cambiar de prompt o de modelo exige correr los evals y actualizar `evals/results.md`. Último resultado: 7/7 con `nvidia/nemotron-3-super-120b-a12b:free` (2026-10-08).
