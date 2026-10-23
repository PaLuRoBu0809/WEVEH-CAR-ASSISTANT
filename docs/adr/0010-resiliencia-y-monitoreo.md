# ADR 0010 — Resiliencia por módulo y monitoreo de errores

- **Estado:** aceptada
- **Fecha:** 2026-10-10
- **Autores:** Isaac Cano, Pablo Rodríguez

## Contexto

Si una parte falla (OpenRouter caído, un módulo con un error), el resto de la app debe seguir funcionando, y el equipo debe enterarse de qué falló sin esperar a que un usuario lo reporte.

## Decisión

### Resiliencia

| Mecanismo | Qué hace | Dónde |
|---|---|---|
| **Interruptor por módulo** | `WEVEH_MODULO_<NOMBRE>=inactivo` apaga un módulo: sus endpoints responden 503 "en mantenimiento" y la app desactiva esa función; los demás siguen | Todos los módulos |
| **Cortacircuitos** (Resilience4j) | Si la cadena de modelos falla de forma seguida (3 consultas), durante 60 s se responde la respuesta segura al instante; luego prueba una y, si funciona, vuelve a la normalidad | Llamadas a OpenRouter y al buscador web |
| **Compartimento** (bulkhead) | Cupo de llamadas simultáneas (10 consultas de IA a la vez) para que un módulo lento no deje sin capacidad al resto | `mecanicoia`, `perfilamiento` |
| **Tiempos máximos** | Ninguna llamada externa espera indefinidamente (5 s para conectar, 20 s por modelo, 45 s en total) | Adaptadores de `infrastructure` |
| **Salud por módulo** | `/actuator/health` muestra el estado de cada módulo y sus dependencias (base de datos, OpenRouter, buscador) | Actuator |

### Monitoreo

- **Sentry** (plan gratis) en el backend y en la app: avisa por correo cuando algo falla y muestra en un panel qué pasó, dónde, cuántas veces y a cuántas personas afectó.
- Se configura para **no enviar datos personales** (nombre, correo, token, llaves); los logs tampoco los contienen (RNF-23).

## Alternativas consideradas

- **Solo los logs de Render:** hay que ir a buscar los errores; no avisa.
- **Microservicios para aislar fallas:** ver ADR 0003.

## Consecuencias

- Lo que tumba el proceso completo (sin memoria, base de datos caída) no se aísla con esto: se mitiga con varias copias del backend o sacando un módulo a su propio servicio (ADR 0003).
- Dependencias nuevas: Resilience4j y el SDK de Sentry (backend y app).
- El mapa de dependencias entre módulos (ADR 0003) dice qué funciones se desactivan si un módulo se apaga.

## Enmienda (2026-10-23): cómo se construyó

- **Interruptor:** `InterruptorModulos` (interceptor de Spring MVC) toma el módulo del paquete del controlador y lee `WEVEH_MODULO_<NOMBRE>`. Se pueden apagar `garaje`, `catalogo` y `mecanicoia`; `cuentas` no, porque sin ella no se entra. Responde 503 `modulo-inactivo`.
- **Cortacircuitos y compartimento:** con el núcleo de Resilience4j 2.4.0, sin su integración con Spring Boot (todavía no hay versión para Boot 4), en `MotorDiagnosticoProtegido`, que envuelve al adaptador de OpenRouter sin tocar el caso de uso. Una respuesta vacía de la cadena de modelos cuenta como falla. Con el cortacircuitos abierto llega la respuesta segura al instante; con el cupo lleno, 503 `mucha-demanda`.
- **Tiempos máximos:** ya estaban en el adaptador: 5 s para conectar, 20 s por modelo y 45 s en total.
- **Salud:** `/actuator/health` muestra `modulos` (activo o inactivo) y `openrouter` (estado del cortacircuitos), además de la base de datos. Los dos van siempre en UP: un módulo apagado a propósito o la IA caída no deben hacer que Render reinicie el servicio.
- **Sentry** (organización `weveh-group`): `sentry-spring-boot-4-starter` en el backend y `@sentry/react-native` en la app. Sin DSN (`SENTRY_DSN`, `EXPO_PUBLIC_SENTRY_DSN`) no envían nada. Van con `send-default-pii` apagado y un filtro (`FiltroSentry`, `limpiarEvento`) que borra usuario, IP, cabeceras, cookies, cuerpo y parámetros de la petición. Sin capturas de pantalla ni trazas de rendimiento.
- **Conexiones a la base:** máximo `WEVEH_DB_POOL` (7) por backend; ver la nota del ADR 0008.
