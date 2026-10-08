---
name: catalogo-vehiculos
description: Cómo cargar el Excel de vehículos de Colombia a Supabase (PostgreSQL), su esquema normalizado y los filtros en cascada marca → línea → año → versión para el registro. Úsala al importar o actualizar el catálogo, crear sus tablas o endpoints, o construir el selector de vehículo en la app.
---

# Catálogo de vehículos de Colombia

El equipo tiene un Excel con todos los vehículos de Colombia. Es grande: no se manda entero a la app ni al modelo de IA. Se normaliza en Postgres y se consulta con filtros en cascada.

## 1. Inspeccionar el Excel primero

Antes de diseñar nada, mira el archivo real:

```bash
python3 -m pip install pandas openpyxl
python3 - <<'PY'
import pandas as pd
df = pd.read_excel("RUTA/al/archivo.xlsx", sheet_name=None)
for hoja, d in df.items():
    print(hoja, d.shape); print(d.head(5).to_string()); print(d.dtypes)
PY
```

Anota en `docs/catalogo.md`: hojas, filas, columnas, ejemplos y problemas (marcas escritas de varias formas, años como texto, cilindrada en litros o cc). Ajusta el mapeo de columnas del script con eso.

## 2. Esquema normalizado (esquema `catalogo`)

```sql
create schema if not exists catalogo;

create table catalogo.marca (
  id bigserial primary key,
  nombre text not null,
  nombre_normalizado text not null unique,
  tipo text not null check (tipo in ('CARRO','MOTO','AMBOS'))
);

create table catalogo.linea (
  id bigserial primary key,
  marca_id bigint not null references catalogo.marca(id),
  nombre text not null,
  nombre_normalizado text not null,
  unique (marca_id, nombre_normalizado)
);

create table catalogo.version (
  id bigserial primary key,
  linea_id bigint not null references catalogo.linea(id),
  anio_modelo int not null,
  nombre text not null,                 -- ej. "VX 3.4 V6 4x4 AT"
  cilindrada_cc int,
  combustible text,
  transmision text,
  traccion text,
  carroceria text,
  datos_originales jsonb not null,      -- la fila del Excel tal cual, para trazabilidad
  unique (linea_id, anio_modelo, nombre)
);

create index on catalogo.version (linea_id, anio_modelo);
alter table catalogo.marca   enable row level security;
alter table catalogo.linea   enable row level security;
alter table catalogo.version enable row level security;
```

En el repo esto va como migración Flyway (`V<n>__catalogo.sql`). La carga de datos no va en Flyway: va con el script.

## 3. Importar

`${CLAUDE_PLUGIN_ROOT}/skills/catalogo-vehiculos/scripts/importar_catalogo.py` lee el Excel, normaliza y escribe CSVs listos para `\copy`:

```bash
python3 ${CLAUDE_PLUGIN_ROOT}/skills/catalogo-vehiculos/scripts/importar_catalogo.py \
  --excel RUTA/al/archivo.xlsx --hoja "Hoja1" \
  --mapeo mapeo.json --salida salida_catalogo/
```

`mapeo.json` dice qué columna del Excel es cada campo:

```json
{"marca": "MARCA", "linea": "LINEA", "anio_modelo": "MODELO", "version": "VERSION",
 "cilindrada": "CILINDRAJE", "combustible": "COMBUSTIBLE", "tipo": "CLASE",
 "transmision": null, "traccion": null, "carroceria": "CARROCERIA"}
```

Luego, con la cadena de conexión de Supabase (nunca la subas al repo):

```bash
psql "$WEVEH_DB_URL" -c "\copy catalogo.marca(id,nombre,nombre_normalizado,tipo) from 'salida_catalogo/marca.csv' csv header"
# luego linea.csv, version.csv y el ajuste de secuencias: el script imprime los comandos exactos
```

Revisa el resumen que imprime el script: filas descartadas y por qué, marcas duplicadas fusionadas, años fuera de rango.

## 4. API para el registro

| Endpoint | Respuesta |
|---|---|
| `GET /api/v1/catalogo/marcas?tipo=CARRO&q=toy` | marcas que coinciden |
| `GET /api/v1/catalogo/marcas/{id}/lineas?q=pra` | líneas |
| `GET /api/v1/catalogo/lineas/{id}/anios` | años disponibles |
| `GET /api/v1/catalogo/lineas/{id}/versiones?anio=2008` | versiones con motor, cilindrada, combustible |

Búsqueda sin tildes y sin mayúsculas sobre `nombre_normalizado`. Respuestas pequeñas (máximo 50). La app guarda en caché las marcas y las líneas consultadas.

## 5. Relación con la IA

El catálogo dice qué versión es el vehículo; no trae planes de mantenimiento. El plan sale de la ficha técnica que investiga el agente (skill `agente-perfilador`) usando los datos del catálogo como consulta. Si el usuario no encuentra su versión, se registra con texto libre y queda marcada para revisar.
