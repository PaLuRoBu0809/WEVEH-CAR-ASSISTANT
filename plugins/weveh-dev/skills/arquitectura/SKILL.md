---
name: arquitectura
description: Reglas de arquitectura de WEVEH (monolito modular Spring Boot con hexagonal por módulo, app Expo por features, Supabase Postgres, identidad por dispositivo). Úsala antes de crear o mover clases, paquetes, carpetas, endpoints o tablas, o al decidir dónde va una lógica.
---

> **Vigente (2026-10-10):** la arquitectura completa y su estado están en `docs/arquitectura.md`. Cambios respecto a esta skill: cuentas con Supabase Auth reemplazan la identidad por dispositivo (ADR 0005), persistencia con Spring Data JDBC (ADR 0006), eventos guardados (ADR 0007), sin red con SQLite (ADR 0009), resiliencia y Sentry (ADR 0010), módulo `cuentas`.

# Arquitectura de WEVEH (MVP)

## Vista general

```mermaid
flowchart LR
  subgraph Movil["mobile/ (Expo)"]
    UI["Pantallas"] --> Q["TanStack Query"]
    Q --> SQL[("SQLite local")]
    Q --> API
    SS[("SecureStore<br/>dispositivoId")]
  end
  subgraph Backend["backend/ (Spring Boot, monolito modular)"]
    API["REST /api/v1<br/>header X-Weveh-Dispositivo"]
    GAR["garaje"]
    MAN["mantenimiento"]
    DOC["documentos"]
    COM["combustible"]
    PER["perfilamiento"]
    MIA["mecanicoia"]
    CAT["catalogo"]
    API --> GAR & MAN & DOC & COM & PER & MIA & CAT
  end
  PG[("Supabase Postgres")]
  LLM["OpenRouter<br/>modelos :free"]
  Backend --> PG
  PER --> LLM
  MIA --> LLM
```

## Módulos del backend

| Módulo | Responsabilidad | Publica eventos |
|---|---|---|
| `catalogo` | Marcas y líneas de Colombia de las tablas del Ministerio de Transporte (solo lectura); fichas técnicas investigadas | — |
| `garaje` | Vehículo: CRUD, kilometraje, datos de catálogo | `VehiculoRegistrado`, `KilometrajeActualizado`, `VehiculoEliminado` |
| `mantenimiento` | Plan por pieza, historial de servicios, fallas, salud | `PiezaPorVencer` |
| `documentos` | SOAT, RTM, seguro todo riesgo y su vencimiento | `DocumentoPorVencer` |
| `combustible` | Tanqueadas y consumo km/gal | `ConsumoAnomalo` |
| `perfilamiento` | Agente que investiga el modelo y entrevista al usuario | `PerfilCompletado` |
| `mecanicoia` | Diagnóstico por texto + `ValidadorSeguridadDiagnostico` | — |
| `shared` | Value objects comunes (`Kilometraje`, `DispositivoId`), errores, Problem Details | — |

Dependencias permitidas: todos pueden usar `shared`; `mantenimiento`, `perfilamiento` y `mecanicoia` leen el vehículo vía la API pública de `garaje` (`GarajeApi`), nunca vía su repositorio. `perfilamiento` escribe en `mantenimiento` y `documentos` solo a través de sus casos de uso.

## Forma de cada módulo

```
co/weveh/<modulo>/
├── <Modulo>Api.java            # fachada pública (lo único que otros módulos usan)
├── domain/                     # entidades, value objects, reglas. Java puro: sin Spring, sin persistencia
├── application/
│   ├── <CasoDeUso>.java        # interfaz (puerto de entrada)
│   ├── <CasoDeUso>Servicio.java
│   └── puertos/                # interfaces de salida: repositorios, MotorDiagnostico, InvestigadorFichaTecnica...
└── infrastructure/
    ├── web/                    # @RestController + DTOs (records) + mapeadores
    ├── persistencia/           # Spring Data JDBC: filas + repositorios + adaptadores (ADR 0006)
    └── ia/                     # adaptadores de OpenRouter (único lugar donde aparece el proveedor de IA)
```

Reglas:
- Controlador: valida formato, llama un caso de uso, mapea respuesta. Nada más.
- La regla de negocio vive en `domain` (por ejemplo `Vehiculo.actualizarKilometraje`), no en servicios ni controladores.
- Fila de persistencia ≠ entidad de dominio. Mapea en el adaptador.
- Cada caso de uso recibe `DispositivoId` y filtra por él. Un recurso de otro dispositivo responde **404**, no 403.
- Migraciones de esquema solo con Flyway en `backend/src/main/resources/db/migration` (`V<n>__descripcion.sql`). Nunca cambios manuales en Supabase.
- Spring Modulith viene desde la fase 0 (versión gestionada por el BOM que trae start.spring.io). La prueba `ModularidadTest` con `ApplicationModules.of(WevehApplication.class).verify()` es obligatoria y corre en CI.
- Los eventos entre módulos (`VehiculoRegistrado`, `KilometrajeActualizado`...) se publican con `ApplicationEventPublisher` y se escuchan con `@ApplicationModuleListener`.

## App móvil

```
mobile/src/
├── app/                        # Expo Router: solo rutas (Expo SDK 57 las pone en src/app)
│   ├── _layout.tsx
│   ├── (onboarding)/           # encendido, portada, registro de vehículo, completar perfil
│   └── (tabs)/                 # inicio, garaje, preguntar, combustible
├── features/<feature>/{presentation,application,domain,infrastructure}
└── shared/{design-system,http,db,dispositivo}
```

Fronteras con `eslint-plugin-boundaries` v7 (regla `boundaries/dependencies` en `mobile/eslint.config.js`): `app` → features y shared; una feature → sí misma y shared; shared → shared.

- `presentation`: componentes puros (props → UI). `application`: hooks con TanStack Query. `domain`: funciones puras. `infrastructure`: cliente HTTP, SQLite, mapeadores DTO→dominio.
- Una feature no importa archivos internos de otra; comparte por `src/shared` o por el `index.ts` público de la feature.
- Lectura offline: la UI lee de SQLite y TanStack Query refresca en segundo plano. Las escrituras sin red van a una cola con `Idempotency-Key`.
- Diseño: tokens de marca de los mockups (teal `#3CCFB6` sobre fondo oscuro, punto ámbar), modo claro/oscuro, textos sin jerga.

## Identidad sin login

1. Primer arranque: `crypto.randomUUID()` → SecureStore (`weveh.dispositivoId`).
2. Interceptor HTTP agrega `X-Weveh-Dispositivo`.
3. Backend: un filtro valida que sea UUID v4 y lo deja en un `DispositivoId` por request; sin header ⇒ 400.
4. Limitaciones que deben quedar escritas en la UI de ajustes: si desinstalas la app pierdes el acceso a tus datos. Cuando llegue el login, se vincula el `dispositivoId` a la cuenta.

## Supabase

- Un proyecto con dos esquemas: `catalogo` (tablas del Ministerio de Transporte) y `public` (datos de la app).
- El backend se conecta por JDBC con un usuario de servicio (variables `WEVEH_DB_URL`, `WEVEH_DB_USUARIO`, `WEVEH_DB_CLAVE`).
- RLS activado en todas las tablas sin políticas para `anon`/`authenticated`.

## Antes de terminar un cambio de arquitectura

- ¿Alguna clase de `domain` importa Spring, persistencia o el proveedor de IA? Debe ser no.
- ¿Algún módulo importa `infrastructure` o `domain` de otro? Debe ser no.
- ¿La decisión merece un ADR en `docs/adr/NNNN-titulo.md` (contexto, decisión, alternativas, consecuencias)? Si cambia el stack, sí.
