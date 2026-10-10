# ADR 0012 — Contrato de la API generado desde el código

- **Estado:** aceptada
- **Fecha:** 2026-10-10
- **Autores:** Isaac Cano, Pablo Rodríguez

## Contexto

`contracts/openapi.yaml` se escribió a mano en la fase 0 y quedó desactualizado: solo describe `GET /vehiculos` mientras la API ya tiene catálogo, garaje y consultas. Un contrato desactualizado obliga a la app (o a otra app futura) a adivinar.

## Decisión

- El backend **genera el contrato OpenAPI desde el código** (springdoc-openapi) y se guarda en `contracts/openapi.yaml`.
- La **CI compara** el contrato generado con el del repo: si un cambio de código cambia el contrato sin actualizar el archivo, falla. Así cada cambio de API queda visible en el PR.
- [`docs/api.md`](../api.md) explica el contrato en lenguaje claro: autenticación, formato de errores, códigos HTTP, fechas, versionado y cada endpoint con ejemplos.
- La API se versiona en la ruta (`/api/v1`). Un cambio incompatible crea `/api/v2`; agregar campos opcionales no.

## Alternativas consideradas

- **Contrato a mano:** se desactualiza.
- **Contrato primero y generar el código desde él:** más riguroso, pero más ceremonia para un equipo de dos.

## Consecuencias

- Las anotaciones de los controladores y DTOs son la fuente del contrato: deben describir bien cada campo.
- La app puede generar sus tipos TypeScript desde `openapi.yaml`.
