---
name: arranque
description: Orden de construcción de WEVEH desde cero, con los comandos y archivos de la fase 0 (repo, ADRs, requisitos, esqueletos de backend Spring Boot y app Expo, Supabase, CI) y el criterio para cerrar cada fase. Úsala cuando vayas a crear los proyectos, la CI o la estructura inicial, o para saber qué toca construir ahora.
---

# Arranque de WEVEH desde cero

El repo arranca solo con material de referencia (`README.md`, `WEVEH.docx`, notebook y diagrama). El código de las ramas `dev/*` y `makers/*` fue un prototipo: no se copia.

## Fases

| Fase | Qué se construye | Skills | Cierra cuando |
|---|---|---|---|
| 0. Fundaciones | Repo, ADRs, requisitos, esqueletos, CI, Supabase, identidad por dispositivo | esta, `arquitectura` | La app en Expo Go muestra "Tu garaje está vacío" leyendo `GET /api/v1/vehiculos` con su `dispositivoId`, y la CI está en verde |
| 1. Catálogo + Garaje | Cargar las tablas del Ministerio; registro básico; editar y eliminar | `catalogo-vehiculos`, `dominio-vehiculo`, `feature-backend`, `feature-movil` | Se registra la Prado del ejemplo eligiendo Toyota → "PRADO VX 5P AT · 3.400 cc" → 2008 |
| 2. Mantenimiento + Documentos | Plan genérico por pieza, estados, salud, historial, kilometraje, SOAT/RTM/seguro | `dominio-vehiculo` | Inicio muestra "Lo más urgente" correcto para la Prado y los vectores pasan en Java y TS |
| 3. Mecánico IA | Diagnóstico por texto con contexto, validador, evals | `mecanico-ia` | Evals en verde, incluidos todos los casos críticos |
| 4. Completar perfil | Agente con búsqueda web y entrevista | `agente-perfilador` | La Prado termina con correa, frenos y fallas confirmados o `SIN_DATO` |
| 5. Combustible | Tanqueadas y consumo km/gal | `dominio-vehiculo` | El consumo sale tras dos llenos y se clasifica contra la referencia |

Con 0 a 3 hay demo presentable. Cada fase va en PRs pequeños hacia `main`.

## Fase 0 paso a paso

### 0.1 Higiene del repo (primer PR, antes de cualquier proyecto)

`.gitignore` raíz:

```gitignore
# Dependencias y builds
node_modules/
target/
dist/
build/
.expo/
.gradle/
*.apk
*.aab
*.ipa

# Secretos
.env
.env.*
!.env.example

# Editor y sistema
.idea/
.vscode/
*.iml
.DS_Store

# Datos de entrada que no se versionan
datos/
salida_catalogo/
```

Además: `.editorconfig` (UTF-8, LF, 4 espacios en Java, 2 en TS/JSON/YAML) y `.gitattributes` con `* text=auto eol=lf`. Los Excel del Ministerio de Transporte no van al repo: viven en los archivos del proyecto.

### 0.2 Decisiones y requisitos (`docs/`)

```
docs/
├── adr/
│   ├── 0001-stack.md                    # Expo + Spring Boot modular + Supabase + Anthropic
│   ├── 0002-identidad-por-dispositivo.md
│   └── 0003-monolito-modular.md
├── requisitos/
│   ├── README.md                        # índice de IDs y estado
│   └── RF-GAR.md, RF-MAN.md, RF-DOC.md, RF-COM.md, RF-MIA.md, RF-PER.md, RF-CAT.md
├── rnf.md                               # no funcionales medibles (ISO/IEC 25010)
└── arquitectura.md                      # diagrama de contexto y de módulos
```

Formato de ADR: Contexto, Decisión, Alternativas consideradas, Consecuencias. En `0001-stack.md` anota las versiones exactas que generaron `start.spring.io` y `create-expo-app` ese día.

Formato de requisito (ISO/IEC/IEEE 29148, criterios en Gherkin):

```markdown
## RF-GAR-01 Registrar vehículo
Como dueño quiero registrar mi carro en menos de 2 minutos para que WEVEH conozca su estado.
- Dado que elijo Toyota → Prado J95 → 2008 → VX 3.4 V6 y escribo 190.000 km
  Cuando guardo
  Entonces veo el vehículo en mi garaje con su salud calculada
- Dado que escribo un kilometraje negativo
  Cuando guardo
  Entonces veo "El kilometraje debe ser mayor o igual a cero"
```

`rnf.md`, ejemplos medibles: p95 de la API sin IA < 300 ms; diagnóstico IA < 20 s con indicador de progreso; la app abre y muestra el garaje sin red; 0 secretos en el binario; contraste AA; objetivos táctiles ≥ 44 pt.

### 0.3 Contratos (`contracts/`)

```
contracts/
├── openapi.yaml                 # se completa por fase
├── vectores-estado-pieza.json
├── vectores-salud.json
├── vectores-vencimientos.json
└── vectores-consumo.json
```

Formato: `{"descripcion": "regla exacta", "vectores": [{"caso": "aceite vencido por km", "entrada": {...}, "esperado": {...}}]}`. Los mismos archivos los leen las pruebas de JUnit y de Jest.

### 0.4 Backend

Genera el proyecto desde https://start.spring.io (si la red lo permite, con curl):

```bash
curl -sS https://start.spring.io/starter.zip \
  -d type=maven-project -d language=java -d javaVersion=25 \
  -d groupId=co.weveh -d artifactId=weveh-backend -d name=weveh \
  -d packageName=co.weveh \
  -d dependencies=web,validation,data-jpa,flyway,postgresql,actuator,modulith,testcontainers \
  -o backend.zip && unzip backend.zip -d backend && rm backend.zip
```

Si un id de dependencia no existe en la versión del día, elígelo en la web y anótalo en el ADR. Luego agrega `com.anthropic:anthropic-java` (última versión de Maven Central) cuando empiece la fase 3, no antes.

Primer contenido, en este orden:
1. `co.weveh.shared`: `DispositivoId` (record que valida UUID v4), filtro `FiltroDispositivo` que lo exige en `/api/**` (400 con Problem Details si falta o no es válido), `ManejadorErrores` con `ProblemDetail`.
2. `co.weveh.garaje`: solo `GET /api/v1/vehiculos` que devuelve `[]` filtrado por dispositivo (la tabla llega en fase 1).
3. `application.yml` solo con placeholders de entorno; `backend/.env.example` con `WEVEH_DB_URL`, `WEVEH_DB_USUARIO`, `WEVEH_DB_CLAVE`, `ANTHROPIC_API_KEY`, `WEVEH_IA_MODELO`.
4. Pruebas: `ModularidadTest` (`ApplicationModules.of(WevehApplication.class).verify()`), `FiltroDispositivoTest`, y una prueba de integración con Testcontainers Postgres que corre Flyway.

### 0.5 App móvil

Comandos en la skill `feature-movil` ("Crear el proyecto"). Primer contenido:
1. `src/shared/dispositivo`: genera y guarda el UUID en SecureStore.
2. `src/shared/http`: cliente con `EXPO_PUBLIC_API_URL` y el header `X-Weveh-Dispositivo`.
3. `src/shared/design-system/tokens.ts` con los colores de los mockups.
4. Pantallas `src/app/(onboarding)/encendido` y `src/app/(tabs)/garaje` con estado vacío.
5. Scripts `lint`, `test` y `typecheck` en `package.json`; `eslint-plugin-boundaries` configurado por feature.

Para probar en el celular con el backend local, `EXPO_PUBLIC_API_URL` apunta a la IP de tu computador en la red (no `localhost`).

### 0.6 Supabase

1. Crea un proyecto en la región más cercana (São Paulo) y guarda la contraseña en un gestor, no en el repo.
2. Usa la cadena de conexión JDBC del pooler en modo sesión para el backend.
3. Flyway crea los esquemas `catalogo` y `public` y activa RLS en cada tabla. No crees tablas desde el panel.
4. La llave `anon` no se usa en ningún lado del MVP.

### 0.7 CI (`.github/workflows/ci.yml`)

```yaml
name: ci
on:
  pull_request:
  push:
    branches: [main]

jobs:
  higiene:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Rechazar dependencias o secretos rastreados
        run: |
          if git ls-files | grep -E '(^|/)(node_modules|target|dist|\.expo)/|(^|/)\.env$'; then
            echo "Hay archivos que no deben estar en git"; exit 1
          fi

  backend:
    runs-on: ubuntu-latest
    defaults: { run: { working-directory: backend } }
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-java@v4
        with: { distribution: temurin, java-version: '25', cache: maven }
      - run: ./mvnw -B verify

  mobile:
    runs-on: ubuntu-latest
    defaults: { run: { working-directory: mobile } }
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: lts/*, cache: npm, cache-dependency-path: mobile/package-lock.json }
      - run: npm ci
      - run: npm run lint
      - run: npx tsc --noEmit
      - run: npm test -- --ci
```

Testcontainers necesita Docker, que los runners `ubuntu-latest` ya traen. Protege `main`: PR obligatorio, CI en verde y una aprobación del otro integrante.

## Errores comunes al arrancar

- Crear pantallas antes de que exista la identidad por dispositivo: después toca rehacer todas las llamadas.
- Poner reglas de salud o vencimiento en componentes "mientras tanto": van en `domain` desde el primer día, con vector.
- Conectar la app a Supabase "solo para el demo": rompe la regla de seguridad y luego nadie lo quita.
- Agregar el SDK de IA en la fase 0: no hace falta hasta la fase 3 y obliga a manejar la llave antes de tiempo.
