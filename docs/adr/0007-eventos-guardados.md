# ADR 0007 — Eventos entre módulos guardados en la base

- **Estado:** aceptada (se activa al empezar la fase 2)
- **Fecha:** 2026-10-10
- **Autores:** Isaac Cano, Pablo Rodríguez

## Contexto

Los módulos se avisan por eventos: `garaje` publica `VehiculoRegistrado` y, desde la fase 2, `mantenimiento` lo escucha para crear el plan y `documentos` para calcular vencimientos. Hoy los eventos viven solo en memoria: si quien escucha falla, el aviso se pierde y ese vehículo queda sin plan. En la fase 0 se quitó el registro de eventos de Spring Modulith porque nadie escuchaba.

## Decisión

- Usar el **registro de publicaciones de eventos de Spring Modulith** con JDBC: cada evento se anota en una tabla en la misma transacción que lo produce, se marca como completado cuando el oyente termina y, si falla, **se reintenta** (al arrancar y de forma programada).
- Los oyentes usan `@ApplicationModuleListener` (asíncronos y en su propia transacción) y deben ser **idempotentes**: procesar dos veces el mismo evento no duplica nada.
- La tabla se crea con una migración Flyway, con RLS como todas.

## Alternativas consideradas

- **Eventos en memoria:** más simple, pero se pierden avisos.
- **Llamadas directas entre módulos** (garaje llama a mantenimiento): acopla los módulos y rompe el aislamiento del ADR 0003.
- **Un broker externo (Kafka, RabbitMQ):** innecesario para un monolito de dos personas.

## Consecuencias

- Un módulo puede fallar al procesar un aviso sin perderlo; cuando se recupera, lo procesa.
- Una tabla más y una regla más para los oyentes (idempotencia), cubierta con pruebas.
