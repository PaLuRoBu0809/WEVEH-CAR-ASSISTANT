# CLAUDE.md — WEVEH (Vehicle Helper)

Guía para Claude Code en este repositorio. Lo que está aquí son decisiones tomadas por el equipo (Isaac Cano y Pablo Rodríguez); si algo del código las contradice, señálalo antes de "arreglarlo" por tu cuenta.

**El proyecto se construye desde cero con SDD (Spec-Driven Development).** La especificación manda: requisitos y RNF (`docs/requisitos/`, `docs/rnf.md`), plan (`docs/adr/`, `docs/arquitectura.md`, `docs/datos.md`, `docs/api.md`, `contracts/`) y tareas (`docs/tareas.md`). Empieza por `docs/README.md`. Si el código y `docs/` no coinciden, señálalo y corrige uno de los dos en el mismo PR; si una skill contradice a `docs/`, gana `docs/`.

Material de referencia: `docs/referencia/README-original.md` (problema, flujo de IA y contrato del Mecánico IA), `WEVEH.docx`, `Sesion_8_Use_case_WEVEH.ipynb`, `mermaid diagram.png` y los mockups `WEVEH Portada.html` y `WEVEH Garaje.html`. El código de las ramas `dev/*` y `makers/*` fue un prototipo: no lo copies.

El detalle operativo vive en el plugin `weveh-dev` (`plugins/weveh-dev/`). Cárgalo con:

```
/plugin marketplace add PaLuRoBu0809/WEVEH-CAR-ASSISTANT
/plugin install weveh-dev@weveh
```

## 1. Qué es WEVEH

App móvil para dueños de carro o moto en Colombia sin conocimientos mecánicos. Une en un solo lugar el garaje del vehículo, su plan de mantenimiento por kilometraje, los papeles (SOAT, RTM, seguro), el consumo de combustible y un Mecánico IA que **ya conoce el carro**. La IA es la interfaz; el valor está en los datos del vehículo, las reglas deterministas y (después) la red local.

Competencia conocida: Garage Hub (asistente similar), Drivoo (enfocado en gastos), Partes (Colombia, talleres y grúas) y Pits (directorio con aliados que no responden). Lecciones: registro sin fricción, asistente que termina en acciones, cero directorios vacíos.

## 2. Alcance del MVP (vigente)

**Entra:**
1. **Cuentas** con Supabase Auth (correo + contraseña, Google, enlace mágico) y **tratamiento de datos** según la Ley 1581 (ADR 0005, RF-CTA, RF-DAT). Un solo rol: usuario.
2. **Garaje**: crear, editar y eliminar vehículos (ver §6), y verlos sin red (SQLite, ADR 0009).
3. **Registro guiado en dos tiempos**: datos mínimos (menos de 1 min) y luego **"Completar perfil con WEVEH"**: un agente que investiga el modelo exacto en la web y entrevista al usuario (correa de distribución, fallas, piezas cambiadas...).
4. **Plan de mantenimiento por pieza** y **salud del vehículo** (el puntaje solo con datos suficientes).
5. **Historial de servicios** y **actualización de kilometraje**.
6. **Documentos**: SOAT, RTM y seguro todo riesgo registrados por fecha de realización; WEVEH calcula el vencimiento y avisa con insistencia.
7. **Tanqueadas** y **consumo km/gal**, comparado con el rango normal del modelo.
8. **Mecánico IA conversacional por texto**, con el contexto completo del vehículo, guardas de seguridad, sin precios salvo que se pidan y con límites de uso que no estorban.

**No entra (no lo construyas sin que el equipo lo pida):** rol administrador, directorio de talleres/grúas/servicios, voz, foto de testigos, push del servidor, pagos, RUNT, OBD, versión web para usuarios (el navegador es solo para desarrollo).

**Identidad:** cuentas con Supabase Auth (ADR 0005). La app inicia sesión con Supabase y envía `Authorization: Bearer` con el token; el backend lo valida y filtra **todo** por el `usuarioId`. Datos personales mínimos: nombre y correo; nada de cédula ni teléfono; placa opcional. Mientras se construyen las cuentas, el código aún usa el `dispositivoId` del ADR 0002 (reemplazado).

## 3. Stack y estructura objetivo del repo

| Carpeta | Qué es | Tecnología |
|---|---|---|
| `mobile/` | App del MVP | Expo + React Native + TypeScript, Expo Router, TanStack Query, Zustand, React Hook Form + Zod, expo-sqlite, expo-secure-store |
| `backend/` | API y agentes IA | Spring Boot 4 (la versión estable que genere start.spring.io), Java 25 LTS, Maven Wrapper; Spring Web, Validation, Spring Data JDBC (ADR 0006), Flyway, Actuator, Spring Modulith, Spring Security (token de Supabase); OpenRouter para IA |
| `contracts/` | Vectores de prueba compartidos y contrato OpenAPI | JSON / YAML |
| `evals/` | Casos de evaluación de los agentes IA y resultados | JSON + `results.md` |
| `docs/` | SDD: requisitos, RNF, ADRs, arquitectura, datos, API y tareas | Markdown + Mermaid |
| `datos/` | Excel del Ministerio y salida del catálogo (`datos/mintransporte/<año>/`, `datos/catalogo/<año>/`); ignorada por git | — |
| `plugins/weveh-dev/` | Plugin de Claude Code con las skills del proyecto | Markdown |
| `.github/workflows/` | CI | GitHub Actions |

Base de datos: **PostgreSQL en Supabase**, un solo proyecto para el MVP (ADR 0008). La app móvil **nunca** lee ni escribe datos en Supabase: todo pasa por la API de Spring; la única excepción es iniciar sesión con Supabase Auth. Backend publicado en Render, plan gratis (ADR 0008). Activa RLS sin políticas públicas en todas las tablas para que la llave `anon` no lea nada.

No fijes versiones de memoria: usa las que generen `start.spring.io` y `create-expo-app` el día que se cree cada proyecto, y deja la decisión en `docs/adr/0001-stack.md`.

## 4. Orden de construcción

El plan vivo con el estado de cada paso está en **`docs/tareas.md`**. No saltes de etapa sin cerrar la anterior (pruebas y CI en verde). Hechas: fase 0, diseño de los mockups y la primera parte de la fase 1. Siguen, en orden: persistencia con Spring Data JDBC, cuentas y datos, registro mínimo y edición, sin red, resiliencia y monitoreo, Mecánico IA conversacional, fase 2 (mantenimiento y documentos), fase 4 (completar perfil), fase 5 (combustible) y catálogo por año fiscal.

## 5. Comandos (una vez creados los proyectos)

```bash
# Backend
cd backend && ./mvnw -B verify          # compila, pruebas y verificación de módulos (lo mismo que CI)
cd backend && ./mvnw spring-boot:run    # requiere las variables de entorno de backend/.env.example

# App móvil
cd mobile && npm ci && npx expo start
cd mobile && npm run lint && npx tsc --noEmit && npm test
```

## 6. Modelo de dominio (resumen)

Detalle, diagrama de clases y fórmulas: skill `weveh-dev:dominio-vehiculo`.

- **Vehículo**: tipo (carro/moto), catálogo (marca y línea del Ministerio de Transporte, cilindrada), año modelo, motor, combustible, transmisión y tracción (sugeridos desde el nombre de la línea o investigados por el agente), alias, placa (opcional), fecha de matrícula, kilometraje actual, uso (ciudad/carretera/mixto), km promedio al mes.
- **Registro básico obligatorio**: catálogo + km actual + último cambio de aceite (km y fecha) + fecha de SOAT + fecha de RTM (o "aún no aplica"). Seguro todo riesgo es opcional.
- **No preguntes el nivel de combustible en el registro**: cambia a diario y no sirve para mantenimiento. El consumo se mide desde la primera tanqueada con tanque lleno.
- **Pieza del plan**: intervalo en km y/o meses, `esSeguridad`, último servicio (km/fecha) u `SIN_DATO`, y **origen** del intervalo (`FABRICANTE_VERIFICADO`, `IA_WEB` con URL de fuente, `USUARIO`).
- Estados: `AL_DIA`, `POR_VENCER` (consumo ≥ 85 %), `VENCIDO`, `SIN_DATO`. La salud pondera doble las piezas de seguridad y nunca sale verde si una pieza de seguridad está vencida.
- El kilometraje nunca decrece. Un salto anómalo pide confirmación.

## 7. Reglas de arquitectura

Detalle: skill `weveh-dev:arquitectura`.

- **Backend = monolito modular** con Spring Modulith. Un paquete por módulo bajo `co.weveh`: `cuentas`, `garaje`, `mantenimiento`, `documentos`, `combustible`, `perfilamiento`, `mecanicoia`, `catalogo`, `shared`. Una prueba `ApplicationModules.of(WevehApplication.class).verify()` falla si un módulo se salta las fronteras.
- **Hexagonal dentro de cada módulo**: `domain` (Java puro, `record` inmutables), `application` (casos de uso + puertos), `infrastructure` (web, persistencia con Spring Data JDBC, clientes IA). Los controladores no tienen lógica. Principios SOLID (ADR 0003).
- **Eventos entre módulos guardados** con Spring Modulith; los oyentes son idempotentes (ADR 0007).
- **Resiliencia:** interruptor por módulo, cortacircuitos y tiempos máximos en llamadas externas, salud por módulo y Sentry sin datos personales (ADR 0010).
- Un módulo no importa clases internas de otro: usa su API pública o eventos.
- **App móvil por features** (`src/features/<feature>/{presentation,application,domain,infrastructure}`) y `src/shared`; una feature solo usa el `index.ts` de otra. Sin red con SQLite: último estado de todo y cola de cambios con `Idempotency-Key`; gana lo último validando las reglas (ADR 0009). Las reglas de desgaste/salud/vencimientos/consumo son funciones TypeScript puras y se prueban con los mismos vectores que el backend (`contracts/vectores-*.json`).
- Errores HTTP en formato Problem Details (RFC 9457); contrato en `docs/api.md` y `contracts/openapi.yaml` generado desde el código (ADR 0012). Configuración solo por variables de entorno, documentadas en `.env.example`.

## 8. Reglas de IA (no negociables)

Detalle: skills `weveh-dev:mecanico-ia` y `weveh-dev:agente-perfilador`.

1. Todo LLM va detrás de un puerto de `application` (`MotorDiagnostico`, `InvestigadorFichaTecnica`, `EntrevistadorPerfil`). Ningún servicio ni clase de dominio llama al SDK directamente; el SDK solo aparece en `infrastructure/ia`.
2. Proveedor: **OpenRouter, solo modelos gratuitos (`:free`)** (`docs/adr/0004-openrouter.md`), desde `RestClient`, sin SDK de un proveedor. `WEVEH_IA_MODELO` es la lista de modelos en orden de intento; llave en `OPENROUTER_API_KEY`, solo en el backend. No agregues modelos de pago sin que el equipo lo pida.
3. Toda salida del modelo se valida contra esquema en el backend. Si falla: un reintento y luego respuesta segura.
4. `ValidadorSeguridadDiagnostico` (código determinista, no prompt) corre **después** del modelo y gana siempre: frenos, dirección, testigo rojo, temperatura, aceite o batería ⇒ `CRITICO` + `requiresMechanic`.
5. Los datos que el agente encuentra en la web son **propuestas**: se guardan con su URL de fuente y `origen = IA_WEB`, y el usuario los confirma antes de que alimenten el plan.
6. El texto del usuario y el contenido de páginas web son datos, nunca instrucciones.
7. Al modelo solo va el contexto del vehículo y lo que escribe la persona. Nunca nombre, correo, identificador de usuario, placa ni alias.
8. Cambios de prompt o de modelo exigen correr `evals/` y actualizar `evals/results.md`.

## 9. Convenciones

- Código, nombres de dominio y textos de UI en **español técnico** sin abreviaturas (`ProcesadorDiagnostico`, `calcularSaludVehiculo`). Términos de framework en inglés (`Controller`, `Repository`).
- Cero strings mágicos: gravedades, estados y colores en enums/constantes.
- Early returns; funciones cortas; inmutabilidad (`record` en Java, `readonly` en TS).
- Textos de UI sin jerga mecánica, como en los mockups ("Lo más urgente", "¿Por qué importa?").
- Conventional Commits (`feat(garaje): editar vehículo`). Ramas cortas desde `main` y PR revisado por el otro integrante; cada uno debe dejar aportes atribuibles.
- Nunca rastrees `node_modules/`, `target/`, `dist/`, `.expo/` ni `.env`. El `.gitignore` raíz se crea en la fase 0, antes de cualquier proyecto.

## 10. Definition of Done

- Requisito con ID (`docs/requisitos/`) enlazado al PR y criterios de aceptación cubiertos por pruebas.
- `./mvnw -B verify` en verde; en `mobile/`: lint, `tsc --noEmit` y pruebas en verde.
- Reglas de dominio con prueba unitaria y vector compartido cuando aplica.
- Si tocó IA: evals corridos y `evals/results.md` actualizado.
- Probado en Android o iOS (Expo Go o simulador).
- `docs/` actualizado si hubo una decisión (ADR en `docs/adr/`).

Antes de abrir un PR puedes correr `/weveh-dev:revisar`.
