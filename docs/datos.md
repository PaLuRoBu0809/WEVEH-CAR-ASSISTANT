# Modelo de datos

Fuente de verdad del modelo de datos de WEVEH (reemplaza a `plugins/weveh-dev/skills/dominio-vehiculo/references/modelo-dominio.md`, que queda como diseño original). Las reglas que operan sobre estos datos están en la skill `weveh-dev:dominio-vehiculo` y en `contracts/vectores-*.json`.

**Estados:** ✅ existe (migración aplicada) · ⬜ decidido, por construir · 🔜 fase futura. Revisado el 2026-10-10.

## Reglas para todas las tablas

- Se crean y cambian **solo con migraciones Flyway** (`backend/src/main/resources/db/migration/V<n>__descripcion.sql`). Una migración aplicada no se edita: se crea la siguiente.
- **RLS activado sin políticas** en todas: solo el backend (usuario de servicio) las lee.
- Todo lo de una persona cuelga de su cuenta (`usuario_id`, ADR 0005) y se borra en cascada al eliminar la cuenta o el vehículo.
- Persistencia con Spring Data JDBC (ADR 0006): una fila de persistencia por tabla, separada del objeto de dominio.

## Supabase · esquema `catalogo`

| Tabla | Migración | Qué guarda | Estado |
|---|---|---|---|
| `marca` | V2 | 508 marcas (nombre, nombre normalizado sin tildes, tipo CARRO / MOTO / AMBOS) | ✅ |
| `linea` | V2, V8 | 11.583 líneas: nombre del Ministerio ("PRADO VX 5P AT"), cilindrada o potencia, clase, combustible / transmisión / tracción deducidos del nombre (capa 0; nulo = sin dato), genérica sí/no, avalúos por año. Desde V8 el combustible admite `GASOLINA`, `DIESEL`, `GAS`, `HIBRIDO`, `HIBRIDO_ENCHUFABLE` y `ELECTRICO` | ✅ |
| `atributo_linea` | V8 | Lo que el nombre no dice, por línea y atributo (`COMBUSTIBLE`, `TRANSMISION`, `TRACCION`): `valores` (varios = varias versiones), `origen` (`CATALOGO`, `IA_WEB`, `EQUIPO`), `fuente_url` (obligatoria si es `IA_WEB`), `cita`, `tipo_fuente`, `verificada`, `revisado_en` y `lote` (para deshacer un lote completo). Se borra en cascada con la línea. La API solo usa lo verificado o del equipo (RF-CAT-04, RF-CAT-05, ADR 0021) | ✅ |
| años fiscales por línea + `importacion` | — | En qué años fiscales apareció cada línea y un registro de cada importación con su reporte (ADR 0014) | ⬜ |
| `ficha_tecnica` | — | Plan del fabricante, consumo de referencia y fallas conocidas por modelo, con fuentes; `verificada = false` hasta confirmar (ADR 0013) | 🔜 fase 4 |

La búsqueda usa un índice de similitud de texto (`pg_trgm`) sobre el nombre normalizado.

## Supabase · esquema `public`

### Existen hoy

**`vehiculo`** (V3) ✅

| Grupo | Columnas |
|---|---|
| Identidad | `id`, `usuario_id` (llave foránea a `usuario`, se borra en cascada con la cuenta; V5) |
| Qué vehículo es | `tipo`, `catalogo_linea_id` (sin llave foránea, para que recargar el catálogo no rompa nada), `marca`, `linea`, `cilindrada_cc`, `anio_modelo`, `combustible` (con `GAS` e `HIBRIDO_ENCHUFABLE` desde V8), `transmision`, `traccion`; los tres últimos editables (RF-GAR-03) |
| Cómo lo llama la persona | `alias`, `placa` (opcionales) |
| Estado hoy | `km` (0 a 2.000.000), `km_actualizado_en` (día de la última lectura, V7), `uso`, `km_promedio_mes`, `fecha_matricula`, `estado_perfil` |
| Registro inicial | `registro_aceite_km`, `registro_aceite_fecha`, `registro_soat_fecha`, `registro_rtm_fecha`, `registro_rtm_aun_no_aplica`, `registro_seguro_inicio`, `registro_seguro_entidad`. Los consumen mantenimiento y documentos en la fase 2. Todo opcional desde V6 (registro con datos mínimos, RF-GAR-02) |
| Control | `version_fila` (cambios concurrentes), `creado_en` |

**`consulta_mecanico`** (V4) ✅: `vehiculo_id` (cascada), `sintoma`, `nivel_gravedad`, `diagnostico` (jsonb, ya validado), `respuesta_segura`, `modelo` (el que respondió), `version_prompt`, `creado_en`. Con la conversación (RF-MIA-02) pasa a ser un mensaje dentro de una conversación.

**`flyway_schema_history`** ✅: historial de migraciones, con RLS activado por el backend después de migrar.

### Decididas, por construir

| Tabla | Qué guarda | Decisión |
|---|---|---|
| `usuario` | `id` (el de Supabase Auth), `nombre`, `creado_en`. El correo vive en Supabase Auth | ADR 0005 · ✅ V5 |
| `consentimiento` | `usuario_id`, `version_politica`, `aceptado_en`, `medio` (`APP_REGISTRO`, `APP_NUEVA_VERSION`, `APP_GOOGLE`) | RF-DAT-02 · ✅ V5, `APP_GOOGLE` en V9 |
| `conversacion` + `mensaje` | Conversaciones del Mecánico IA por vehículo; cada mensaje con su rol, texto, diagnóstico, modelo y prompt; resumen compactado de lo viejo | RF-MIA-02 |
| `cupo_consultas` | Balde por cuenta: consultas disponibles y última recarga | RF-MIA-07 |
| `event_publication` | Eventos entre módulos pendientes y completados | ADR 0007 |
| `cambio_procesado` | `Idempotency-Key` ya aplicadas, para no guardar dos veces lo que llega de la cola sin red | ADR 0009 |

### Fases futuras

| Tabla | Qué guarda | Fase |
|---|---|---|
| `registro_kilometraje` | Cada lectura de km con fecha y origen (manual, servicio, tanqueada) | 2 |
| `pieza_plan` | Pieza, intervalo en km y/o meses, `es_seguridad`, último servicio, origen (`GENERICO`, `IA_WEB` + fuente, `USUARIO`, `FABRICANTE_VERIFICADO`) | 2 |
| `registro_servicio` | Fecha, km, descripción, taller, valor, piezas cambiadas | 2 |
| `falla` | Síntoma, causa, resolución, abierta o resuelta | 2 |
| `documento_legal` | SOAT, RTM, seguro: fecha de realización, vence, entidad | 2 |
| `sesion_perfilamiento` | Turnos de la entrevista y datos propuestos sin confirmar | 4 |
| `tanqueada` | Fecha, km, galones, valor, tanque lleno | 5 |

## Celular · SQLite (ADR 0009)

| Qué | Para qué |
|---|---|
| Copia del último estado de vehículos, plan, documentos, historial y conversaciones | Ver todo sin red, con "actualizado hace X" |
| Marcas ya buscadas | Elegir marca sin red |
| Cola de cambios pendientes, cada uno con `Idempotency-Key` y la hora del cambio | Enviar lo hecho sin red; gana lo último validando reglas |

Se borra completa al cerrar sesión. En el navegador de desarrollo no hay SQLite.
