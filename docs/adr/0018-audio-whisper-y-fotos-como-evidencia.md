# ADR 0018 — Audio con Whisper de Groq y fotos solo como evidencia

- **Estado:** aceptada (2026-10-21; enmienda parcial del [ADR 0004](0004-openrouter.md) y de CLAUDE.md §8.2)
- **Fecha:** 2026-10-19
- **Autores:** Isaac Cano, Pablo Rodríguez

## Contexto

La voz estaba fuera del MVP. Para registrar servicios y preguntar al Mecánico IA mientras se hace otra cosa (o en el taller), hablar es más cómodo que escribir. Las facturas y el tablero se fotografían fácilmente. Pero CLAUDE.md §8 fija dos reglas: 2) solo OpenRouter con modelos `:free`, y 7) al modelo solo va el contexto del vehículo y lo que escribe la persona, nunca nombre, correo, identificador, placa ni alias. Una foto de factura trae nombre, NIT y placa.

## Decisión

- **Audio:** se transcribe con **Whisper de Groq** (nivel gratuito) como *único* uso de Groq. Es una enmienda a CLAUDE.md §8.2: OpenRouter sigue siendo el proveedor de los modelos de lenguaje; Groq solo pasa voz a texto, detrás de un puerto `Transcriptor` en `infrastructure/ia`.
- **El audio se borra apenas se transcribe.** La persona ve y corrige el texto antes de enviarlo; ese texto sigue las mismas reglas de privacidad, límites y seguridad que cualquier pregunta.
- **Fotos (factura, tablero): solo evidencia.** Se guardan con el servicio o la lectura, las ve solo su dueña o dueño, pasan siempre por la API y **ningún modelo las lee**. Se mantiene CLAUDE.md §8.7 sin cambios.
- Se pide permiso del micrófono con una explicación y la política de datos se actualiza (RF-DAT-09): proveedor externo, transferencia internacional, sin conservación del audio.
- Se omite la lectura automática de facturas y de tableros con modelos de visión.

## Alternativas consideradas

- **Modelos de visión gratuitos de OpenRouter para leer fotos:** existen modelos `:free` con imagen y audio, pero enviarían datos personales a un tercero, exigen consentimiento y revisión de transferencia internacional, y el cupo gratuito reportado es bajo. Queda para una fase posterior, con ADR propio.
- **Solo texto:** cumple todas las reglas, pero deja fuera una entrada que la persona pidió.
- **Whisper por OpenRouter:** no se verificó que OpenRouter ofrezca transcripción gratuita equivalente.

## Consecuencias

- Hay una segunda llave (`GROQ_API_KEY`) solo en el backend, un cortacircuitos y un tiempo máximo propios (ADR 0010) y un límite diario de audios por cuenta.
- RNF-31 (tiempo de transcripción), RNF-33 (medios), RNF-36 (cupo gratuito).
- El límite de uso gratuito de Groq se verificó solo en una fuente secundaria: confirmar en la consola de Groq antes de la demo.
- Cambia la lista "Fuera del MVP": entran la voz (transcripción) y los audios; las fotos se guardan sin ser leídas.

## Evolución prevista (después del MVP)

"Solo evidencia" es una decisión **del MVP**, no un límite del producto. La meta es que el Mecánico IA también
analice **fotos** (tablero con testigos, facturas, la pieza) y **videos cortos**, porque así muestra mejor el problema
quien no sabe de mecánica.

- **El audio es y seguirá siendo solo voz**: lo que la persona dice, transcrito. WEVEH no analiza sonidos del
  vehículo (ruidos del motor, frenos, etc.).
- **El agente orienta, no da certeza**: lo que saque de una foto o un video es una guía, nunca un diagnóstico
  seguro. Siempre lo dice así y manda al mecánico cuando corresponde.

Para eso hace falta, cada vez con su ADR:

- Un proveedor de modelos multimodales que cumpla CLAUDE.md §8 (gratuito o aprobado por el equipo) detrás de un
  puerto de `application`, con evals propios.
- Quitar o tapar los datos personales antes de enviar (placa, nombre y NIT en la factura).
- Autorización explícita de la persona y política de datos actualizada (proveedor, transferencia internacional,
  conservación), que se acepta como versión nueva (RF-DAT-03).
- La regla de seguridad sigue ganando: lo que el modelo vea en una foto o un video nunca baja la gravedad que fija el
  código.

Por eso los textos de la app y de la política dicen "por ahora" y prometen pedir permiso antes de analizar fotos o
videos, sin cerrar la puerta.
