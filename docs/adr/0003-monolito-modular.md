# ADR 0003 — Monolito modular con arquitectura hexagonal por módulo

- **Estado:** aceptada
- **Fecha:** 2026-10-08
- **Autores:** Isaac Cano, Pablo Rodríguez

## Contexto

El backend tiene áreas bien separadas (garaje, mantenimiento, documentos, combustible, catálogo y dos agentes de IA) que comparten el vehículo como eje. Somos dos personas, desplegamos una sola aplicación y queremos que el código no se enrede al crecer ni al cambiar de proveedor de IA.

## Decisión

- **Un solo despliegue de Spring Boot** con un paquete por módulo bajo `co.weveh`: `catalogo`, `garaje`, `mantenimiento`, `documentos`, `combustible`, `perfilamiento`, `mecanicoia` y `shared`.
- **Spring Modulith** verifica las fronteras: la prueba `ModularidadTest` (`ApplicationModules.of(WevehApplication.class).verify()`) corre en CI y falla si un módulo usa clases internas de otro.
- **Hexagonal dentro de cada módulo**:
  - `domain`: Java puro (sin Spring, JPA ni SDK de IA). Aquí viven las reglas.
  - `application`: casos de uso y puertos (repositorios, `MotorDiagnostico`, `InvestigadorFichaTecnica`, `EntrevistadorPerfil`).
  - `infrastructure`: `web` (controladores sin lógica y DTOs), `persistencia` (entidades JPA y adaptadores) e `ia` (el único lugar donde aparece el SDK de Anthropic).
- Los módulos se comunican por su fachada pública (`<Modulo>Api`) o por eventos (`ApplicationEventPublisher` + `@ApplicationModuleListener`).
- En la app móvil se aplica la misma idea por features: `src/features/<feature>/{presentation,application,domain,infrastructure}` con `eslint-plugin-boundaries`.

## Alternativas consideradas

- **Microservicios**: aislamiento fuerte, pero multiplica despliegues, bases de datos y observabilidad para un equipo de dos.
- **Capas clásicas (controller/service/repository) sin módulos**: más rápido al inicio, pero las reglas terminan en servicios y los agentes de IA acoplados al SDK.

## Consecuencias

- Más carpetas y mapeos (entidad JPA ≠ entidad de dominio). Se compensa con las recetas de las skills `feature-backend` y `feature-movil`.
- Si un módulo necesita escalar aparte (por ejemplo `mecanicoia`), ya tiene fronteras limpias para extraerlo.
- Cambiar de proveedor de IA solo toca `infrastructure/ia`.
