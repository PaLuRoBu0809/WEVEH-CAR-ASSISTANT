# ADR 0003 — Monolito modular con arquitectura hexagonal por módulo

- **Estado:** aceptada
- **Fecha:** 2026-10-08 (revisada 2026-10-10)
- **Autores:** Isaac Cano, Pablo Rodríguez

## Contexto

El backend tiene áreas bien separadas (cuentas, garaje, mantenimiento, documentos, combustible, catálogo y dos agentes de IA) que comparten el vehículo como eje. Somos dos personas y desplegamos una sola aplicación. Queremos que el código no se enrede al crecer y que se pueda cambiar cualquier pieza (proveedor de IA, base de datos, app o un módulo interno) sin afectar al resto, que una falla en un módulo no tumbe a los demás, y que el diseño siga los principios SOLID y de programación orientada a objetos.

## Decisión

- **Un solo despliegue de Spring Boot** con un paquete por módulo bajo `co.weveh`: `cuentas`, `catalogo`, `garaje`, `mantenimiento`, `documentos`, `combustible`, `perfilamiento`, `mecanicoia` y `shared`.
- **Spring Modulith** verifica las fronteras: la prueba `ModularidadTest` (`ApplicationModules.of(WevehApplication.class).verify()`) corre en CI y falla si un módulo usa clases internas de otro.
- **Hexagonal dentro de cada módulo**:
  - `domain`: Java puro (sin Spring, sin persistencia, sin proveedor de IA). Aquí viven las reglas.
  - `application`: casos de uso y puertos (repositorios, `MotorDiagnostico`, `BuscadorWeb`, `InvestigadorFichaTecnica`…).
  - `infrastructure`: `web` (controladores sin lógica y DTOs), `persistencia` (Spring Data JDBC, [ADR 0006](0006-persistencia-spring-data-jdbc.md)) e `ia` (el único lugar donde aparece el proveedor de IA, [ADR 0004](0004-openrouter.md)).
- Los módulos se comunican por su fachada pública (`<Modulo>Api`) o por eventos guardados ([ADR 0007](0007-eventos-guardados.md)).
- En la app móvil se aplica la misma idea por features: `src/features/<feature>/{presentation,application,domain,infrastructure}`; una feature solo usa el `index.ts` público de otra (`eslint-plugin-boundaries`).

## Alternativas consideradas

- **Microservicios**: aislamiento fuerte de procesos, pero multiplica despliegues, bases de datos y observabilidad para un equipo de dos.
- **Capas clásicas (controller/service/repository) sin módulos**: más rápido al inicio, pero las reglas terminan en servicios y los agentes de IA acoplados al proveedor.

## Consecuencias

### Cambiar una pieza sin tocar el resto

| Si cambias… | Qué se toca | Qué no se toca |
|---|---|---|
| El proveedor de IA | `mecanicoia/infrastructure/ia` | Reglas, casos de uso, app |
| La base de datos | Los adaptadores de `infrastructure/persistencia` y las migraciones | Dominio, casos de uso, controladores, app |
| La app | La app | El backend (el contrato es `contracts/openapi.yaml`, [ADR 0012](0012-contrato-api.md)) |
| Un módulo interno | Ese módulo | Los demás (solo usan su fachada o sus eventos) |

Matices: otro PostgreSQL solo cambia la URL; otro motor de base de datos exige reescribir los adaptadores porque se usan funciones de Postgres (`pg_trgm`, `jsonb`). Otra app depende de que el contrato de la API esté al día.

### Aislamiento de fallas

El aislamiento es **de código**, no de proceso: todo corre en una sola aplicación, así que lo que tumba el proceso (sin memoria, migración fallida al arrancar, base de datos caída) afecta a todo. Se mitiga con varias copias del backend o sacando un módulo a su propio servicio. Dentro del proceso, [ADR 0010](0010-resiliencia-y-monitoreo.md) define el interruptor por módulo, el cortacircuitos, los compartimentos y la salud por módulo.

Dependencias (si cae el de la izquierda, no funcionan los de la derecha):

| Módulo | Dependen de él |
|---|---|
| `cuentas` | Todos los que guardan datos de la persona |
| `garaje` | `mantenimiento`, `documentos`, `combustible`, `perfilamiento`, `mecanicoia` |
| `catalogo` | El registro de vehículos y `perfilamiento` |
| `mantenimiento` | `mecanicoia` (contexto del plan) |
| `mecanicoia`, `combustible`, `perfilamiento` | Ninguno |

### SOLID y POO como guía de revisión

| Principio | Cómo se aplica |
|---|---|
| Responsabilidad única | El controlador solo traduce HTTP; el dominio solo tiene reglas; el adaptador solo persiste |
| Abierto/cerrado | Un proveedor nuevo es un adaptador nuevo que implementa el puerto; el servicio no cambia |
| Sustitución de Liskov | Cualquier implementación de un puerto sirve igual (las pruebas usan dobles) |
| Segregación de interfaces | Las fachadas exponen solo lo que otros módulos necesitan (`GarajeApi.buscar`) |
| Inversión de dependencias | Los casos de uso dependen de puertos, no de Spring Data, Supabase ni OpenRouter |
| Encapsulamiento | El dominio es inmutable (`record`) y solo cambia por métodos que validan |
| Objetos de valor | `Kilometraje`, `TextoBusqueda`, identificadores con sus propias reglas |

### Costos

- Más carpetas y mapeos (fila de persistencia ≠ entidad de dominio). Se compensa con las recetas de las skills `feature-backend` y `feature-movil`.
- Si un módulo necesita escalar aparte (por ejemplo `mecanicoia`), ya tiene fronteras limpias para extraerlo.
