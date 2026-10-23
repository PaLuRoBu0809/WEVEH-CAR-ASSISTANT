# ADR 0017 — Servicio como factura y concepto del mecánico

- **Estado:** aceptada (2026-10-21)
- **Fecha:** 2026-10-19
- **Autores:** Isaac Cano, Pablo Rodríguez

## Contexto

RF-MAN-04 original registra un servicio atado a una sola pieza. En la vida real un servicio es una factura con varios trabajos (aceite, filtro de aceite, filtro de aire, una revisión), trae recomendaciones del mecánico y, a veces, una foto. Además la persona quiere anotar lo que le dijo su mecánico y que pese más que el intervalo, y que el agente conozca todos los servicios.

## Decisión

- **`Servicio`** (cabecera): fecha, kilometraje, taller, total opcional, notas, recomendaciones del mecánico y foto opcional de la factura (solo evidencia, ADR 0018).
- **`ServicioItem`** (líneas): pieza, acción (`CAMBIO`, `REVISION`, `AJUSTE`) y especificación (por ejemplo "aceite 5W-30 sintético"). **Solo `CAMBIO` reinicia el intervalo de la pieza.**
- **Kits rápidos** ("cambio de aceite" = aceite + filtro) para no volver engorroso el registro.
- **El agente ayuda a crear el servicio** por texto o voz (RF-MAN-04b): propone un borrador, pregunta lo que falta y la persona confirma. Es una propuesta validada por esquema en el backend (CLAUDE.md §8.3 y §8.5).
- **`ConceptoMecanico`:** veredicto de la persona sobre una pieza, con fecha, vigencia por fecha o kilómetros y estado. Las recomendaciones de un servicio se vuelven conceptos pendientes con fecha objetivo.
- **Precedencia al calcular el estado de una pieza:** 1) regla de seguridad por síntomas, 2) concepto vigente del mecánico, 3) observación más reciente de la persona (revisión rápida), 4) intervalo calculado.
- Lo que dice el mecánico es **información**: no se usa para ajustar ni entrenar ningún modelo (RF-MIA-09).

## Alternativas consideradas

- **Un servicio por pieza:** simple, pero obliga a repetir fecha, kilómetros y taller por cada trabajo y no refleja la factura.
- **Leer la factura con un modelo de visión:** rápido para el usuario, pero la factura trae nombre, NIT y placa y chocaría con CLAUDE.md §8.7; queda para otra fase (ADR 0018).
- **Que el concepto del mecánico cambie el intervalo:** mezcla un veredicto puntual con una regla; por eso es un concepto aparte con vigencia.

## Consecuencias

- Tablas `servicio`, `servicio_item`, `concepto_mecanico` y `revision_rapida` (fase 2) en lugar de un `registro_servicio` único.
- RF-MAN-05 muestra servicios con sus trabajos y filtros por pieza.
- El Mecánico IA recibe el historial completo (RF-MIA-10).
- La vigencia por defecto del concepto (90 días o 3.000 km) queda por confirmar (D-07).
