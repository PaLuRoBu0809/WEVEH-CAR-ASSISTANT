# ADR 0001 — Stack del MVP

- **Estado:** aceptada
- **Fecha:** 2026-10-08
- **Autores:** Isaac Cano, Pablo Rodríguez

## Contexto

WEVEH se construye desde cero (el código de `dev/*` y `makers/*` fue un prototipo). El MVP es una app móvil para Android e iOS con un backend que guarda los datos del vehículo, aplica reglas deterministas de mantenimiento y documentos, y orquesta dos agentes de IA (Mecánico IA y perfilador con búsqueda web). El equipo son dos personas con experiencia en Java y TypeScript, y el producto se presenta como demo en el curso Makers AI Product.

## Decisión

| Capa | Tecnología | Versión fijada el 2026-10-08 |
|---|---|---|
| App móvil | Expo + React Native + TypeScript, Expo Router | Expo SDK 57 (`expo@57.0.27`, `create-expo-app@5.0.0`) |
| Estado y datos en la app | TanStack Query, Zustand, React Hook Form + Zod, expo-sqlite, expo-secure-store | Las que instale `npx expo install` para SDK 57 |
| Backend | Spring Boot, Java LTS, Maven Wrapper | Spring Boot 4.1.1, Java 25 (Temurin 25.0.4) |
| Módulos del backend | Spring Web, Validation, Data JPA, Flyway, PostgreSQL, Actuator, Spring Modulith, Testcontainers | Gestionadas por el BOM de Spring Boot 4.1.1 |
| Base de datos | PostgreSQL gestionado en Supabase (región São Paulo) | La que ofrezca Supabase al crear el proyecto |
| IA | ~~Anthropic Java SDK~~ → reemplazado por OpenRouter con modelos gratuitos ([ADR 0004](0004-openrouter.md)) | — |
| CI | GitHub Actions | — |

Las versiones se tomaron de `start.spring.io` (valor por defecto de Boot y opción Java 25) y de `npm view` el día de esta decisión. Si al generar los proyectos cambian, se actualiza esta tabla en el mismo PR.

## Alternativas consideradas

- **Flutter** en vez de Expo: buen rendimiento, pero obliga a aprender Dart y no comparte lenguaje con las reglas puras en TypeScript.
- **Backend en Node (NestJS)** o **solo Supabase (Edge Functions + acceso directo desde la app)**: menos piezas, pero mezcla reglas de negocio con el cliente, expone la base a la llave `anon` y dificulta aplicar reglas de IA no negociables en un solo lugar. Se descarta el acceso directo a Supabase desde la app.
- **Java 21**: estaba instalado en un equipo, pero 25 es la LTS vigente y la que soporta el Spring Boot actual sin ajustes.
- **Otro proveedor de LLM**: el equipo ya diseñó el flujo y el contrato con Claude; el puerto `MotorDiagnostico` permite cambiarlo después sin tocar el dominio.

## Consecuencias

- Hay dos lenguajes (Java y TypeScript). Las reglas de dominio que viven en ambos se protegen con vectores de prueba compartidos en `contracts/`.
- La app nunca habla con Supabase: toda lectura y escritura pasa por la API de Spring.
- Las pruebas de integración necesitan Docker (Testcontainers) en local y en CI.
- El SDK de IA no entra hasta la fase 3, así que las fases 0 a 2 no manejan llaves de Anthropic.
