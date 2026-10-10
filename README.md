# WEVEH — tu vehículo al día

App móvil para dueños de carro o moto en Colombia sin conocimientos mecánicos: un mecánico de confianza en el bolsillo que ya conoce tu vehículo. Avisa antes de que se venza el SOAT o toque un cambio, explica qué le pasa al carro sin jerga y reúne su historia, sus papeles y su consumo.

Proyecto del curso Makers AI Product (Equipo Salchicha: Isaac Cano y Pablo Rodríguez). El planteamiento original del curso está en [`docs/referencia/README-original.md`](docs/referencia/README-original.md).

## Documentación

Se construye con SDD (especificación → plan → tareas). Empieza por **[`docs/README.md`](docs/README.md)**.

| Qué | Dónde |
|---|---|
| Qué debe hacer | [`docs/requisitos/`](docs/requisitos/README.md), [`docs/rnf.md`](docs/rnf.md) |
| Por qué está hecho así | [`docs/adr/`](docs/adr/) |
| Cómo está armado | [`docs/arquitectura.md`](docs/arquitectura.md), [`docs/datos.md`](docs/datos.md), [`docs/api.md`](docs/api.md) |
| Qué falta | [`docs/tareas.md`](docs/tareas.md) |
| Guía para Claude Code | [`CLAUDE.md`](CLAUDE.md) y el plugin `plugins/weveh-dev/` |

## Estructura

| Carpeta | Qué es |
|---|---|
| `mobile/` | App Expo (React Native + TypeScript) |
| `backend/` | API Spring Boot (Java 25), monolito modular |
| `contracts/` | Contrato OpenAPI y vectores de reglas compartidos entre backend y app |
| `evals/` | Evaluación del Mecánico IA |
| `docs/` | Documentación (SDD) |

## Correr en local

Requisitos: Java 25, Node LTS, Docker (para las pruebas de integración) y, para probar en Android, el emulador de Android Studio.

```bash
# Backend (copia backend/.env.example a backend/.env y llénalo)
cd backend && ./mvnw spring-boot:run
cd backend && ./mvnw -B verify          # pruebas, igual que la CI

# App (copia mobile/.env.example a mobile/.env)
cd mobile && npm ci && npx expo start   # "a" abre el emulador de Android
cd mobile && npm run lint && npm run typecheck && npm test
```
