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
| `linea` | V2 | 11.583 líneas: nombre del Ministerio ("PRADO VX 5P AT"), cilindrada o potencia, clase, combustible / transmisión / tracción inferidos, genérica sí/no, avalúos por año | ✅ |
| años fiscales por línea + `importacion` | — | En qué años fiscales apareció cada línea y un registro de cada importación con su reporte (ADR 0014) | ⬜ |
| `ficha_tecnica` | — | Plan del fabricante, consumo de referencia y fallas conocidas por modelo, con fuentes; `verificada = false` hasta confirmar (ADR 0013) | 🔜 fase 4 |

La búsqueda usa un índice de similitud de texto (`pg_trgm`) sobre el nombre normalizado.

## Supabase · esquema `public`

### Existen hoy

**`vehiculo`** (V3) ✅

| Grupo | Columnas |
|---|---|
| Identidad | `id`, `dispositivo_id` (→ `usuario_id` con ADR 0005) |
| Qué vehículo es | `tipo`, `catalogo_linea_id` (sin llave foránea, para que recargar el catálogo no rompa nada), `marca`, `linea`, `cilindrada_cc`, `anio_modelo`, `combustible`, `transmision`, `traccion` |
| Cómo lo llama la persona | `alias`, `placa` (opcionales) |
| Estado hoy | `km` (0 a 2.000.000), `uso`, `km_promedio_mes`, `fecha_matricula`, `estado_perfil` |
| Registro inicial | `registro_aceite_km`, `registro_aceite_fecha`, `registro_soat_fecha`, `registro_rtm_fecha`, `registro_rtm_aun_no_aplica`, `registro_seguro_inicio`, `registro_seguro_entidad`. Los consumen mantenimiento y documentos en la fase 2. **`registro_soat_fecha` deja de ser obligatoria** (registro con datos mínimos) |
| Control | `version_fila` (cambios concurrentes), `creado_en` |

**`consulta_mecanico`** (V4) ✅: `vehiculo_id` (cascada), `sintoma`, `nivel_gravedad`, `diagnostico` (jsonb, ya validado), `respuesta_segura`, `modelo` (el que respondió), `version_prompt`, `creado_en`. Con la conversación (RF-MIA-02) pasa a ser un mensaje dentro de una conversación.

**`flyway_schema_history`** ✅: historial de migraciones, con RLS activado por el backend después de migrar.

### Decididas, por construir

| Tabla | Qué guarda | Decisión |
|---|---|---|
| `usuario` | `id` (el de Supabase Auth), `nombre`, `creado_en`. El correo vive en Supabase Auth | ADR 0005 |
| `consentimiento` | `usuario_id`, `version_politica`, `aceptado_en`, `medio` | RF-DAT-02 |
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
