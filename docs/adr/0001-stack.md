# ADR 0001 — Stack del MVP

- **Estado:** aceptada · la fila "IA" la reemplaza el [ADR 0004](0004-openrouter.md) y la fila "Módulos del backend" (Data JPA) el [ADR 0006](0006-persistencia-spring-data-jdbc.md)
- **Fecha:** 2026-10-08 (revisada 2026-10-10)
- **Autores:** Isaac Cano, Pablo Rodríguez

## Contexto

WEVEH se construye desde cero (el código de `dev/*` y `makers/*` fue un prototipo). El MVP es una app móvil para Android e iOS con un backend que guarda los datos del vehículo, aplica reglas deterministas de mantenimiento y de documentos del vehículo (SOAT, revisión técnico-mecánica, seguro) y orquesta dos agentes de IA (Mecánico IA y perfilador con búsqueda web). El equipo son dos personas con experiencia en Java y TypeScript, y el producto se presenta como demo en el curso Makers AI Product.

## Decisión

| Capa | Tecnología | Versión fijada el 2026-10-08 |
|---|---|---|
| App móvil | Expo + React Native + TypeScript, Expo Router | Expo SDK 57 (`expo@57.0.27`, `create-expo-app@5.0.0`) |
| Estado y datos en la app | TanStack Query, Zustand, React Hook Form + Zod, expo-sqlite (sin red, [ADR 0009](0009-sin-red-sqlite.md)), expo-secure-store | Las que instale `npx expo install` para SDK 57 |
| Backend | Spring Boot, Java LTS, Maven Wrapper | Spring Boot 4.1.1, Java 25 (Temurin 25.0.4) |
| Módulos del backend | Spring Web, Validation, Spring Data JDBC ([ADR 0006](0006-persistencia-spring-data-jdbc.md)), Flyway, PostgreSQL, Actuator, Spring Modulith, Testcontainers | Gestionadas por el BOM de Spring Boot 4.1.1 |
| Base de datos | PostgreSQL gestionado en Supabase (región São Paulo) | PostgreSQL 17 |
| IA | ~~Anthropic Java SDK~~ → OpenRouter con modelos gratuitos ([ADR 0004](0004-openrouter.md)) | — |
| CI | GitHub Actions | — |

Las versiones se tomaron de `start.spring.io` (valor por defecto de Boot y opción Java 25) y de `npm view` el día de esta decisión. Si cambian, se actualiza esta tabla en el mismo PR.

## Alternativas consideradas

- **Flutter** en vez de Expo: buen rendimiento, pero usa Dart, un lenguaje que el equipo no conoce. Con Expo, la app y sus reglas se escriben en TypeScript, que ya dominan.
- **Backend en Node (NestJS)** o **solo Supabase (Edge Functions + acceso directo desde la app)**: menos piezas, pero mezcla reglas de negocio con el cliente, expone la base de datos y dificulta aplicar reglas de IA no negociables en un solo lugar. Se descarta que la app lea o escriba datos directo en Supabase (la excepción es iniciar sesión con Supabase Auth, [ADR 0005](0005-cuentas-supabase-auth.md)).
- **Java 21**: estaba instalado en un equipo, pero 25 es la LTS vigente y la que soporta el Spring Boot actual sin ajustes.

## Consecuencias

- **El proyecto usa dos lenguajes: Java en el backend y TypeScript en la app.** Algunas reglas (vencimientos, estado de piezas, salud, consumo) existen en ambos lados: en el backend porque es la fuente de verdad y en la app para mostrarlas al instante y sin red. Las dos versiones podrían dar resultados distintos; para evitarlo, ambas se prueban contra los mismos **vectores compartidos** de `contracts/vectores-*.json` (casos con entrada y resultado esperado): si una se desvía, su prueba falla.
- La app nunca lee ni escribe datos directo en Supabase: toda lectura y escritura pasa por la API de Spring.
- **Las pruebas de integración levantan un PostgreSQL 17 temporal en Docker** (Testcontainers), igual al de producción, corren las migraciones y lo destruyen al terminar; nunca usan la base de Supabase. Por eso Docker es necesario en local y en la CI.
