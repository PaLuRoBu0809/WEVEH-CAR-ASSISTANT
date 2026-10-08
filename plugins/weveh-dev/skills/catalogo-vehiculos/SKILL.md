---
name: catalogo-vehiculos
description: Cómo cargar a Supabase (PostgreSQL) las tablas de base gravable del Ministerio de Transporte que usa WEVEH como catálogo de vehículos de Colombia, su esquema, sus limitaciones y la búsqueda marca → línea para el registro. Úsala al importar o actualizar el catálogo, crear sus tablas o endpoints, o construir el selector de vehículo en la app.
---

# Catálogo de vehículos de Colombia

## 1. De dónde salen los datos

Las tablas de **base gravable** que publica el Ministerio de Transporte cada año fiscal (avalúo de cada línea por año modelo, en miles de pesos). El equipo tiene las de 2025:

| Tabla | Contenido | Filas |
|---|---|---|
| 1 | Automóviles | 4.820 |
| 2 | Camionetas y camperos | 3.343 |
| 3 | Camionetas doble cabina | 608 |
| 5 | Motocicletas, motocarros, cuatrimotos, mototriciclos y eléctricas | 2.608 |
| 9 | Híbridos | 226 |

Las tablas 4, 6, 7 y 8 no se han cargado. Los Excel no van al repo; viven en los archivos del proyecto.

Formato de cada Excel: una hoja, título en la fila 2 ("TABLA N.- ... AÑO FISCAL 2025"), encabezado en la fila 4 (`ID`, `TIPO`, `CLASE`, `MARCA`, `LINEA`, `CILINDRAJE`, `CAPACIDAD`, `AÑO MODELO`), años 2000 a 2024 como columnas en la fila 5 y una fila por línea con su avalúo en cada año.

## 2. Lo que estos datos sí y no dicen

- **Sí**: marca, línea comercial con su variante en el mismo texto ("PRADO VX 5P AT"), clase, cilindrada en cc (o potencia en kW para eléctricos), pasajeros y tonelaje a veces, y el avalúo por año modelo.
- **No**: en qué años se vendió cada línea (casi todas traen valor en los 25 años porque es una proyección), versión separada, combustible, transmisión, código de motor, modelos 2025 en adelante ni anteriores a 2000.
- Por eso:
  - El **año modelo** se pide aparte (lista de 1950 al año siguiente al actual), no se filtra desde el catálogo.
  - Combustible, transmisión, tracción y puertas se **infieren del nombre** ("AT", "MT", "DIESEL", "4X4", "5P") y quedan nulos si no hay pista. En la app se muestran como sugerencia editable.
  - El código de motor, el sistema de distribución y lo demás lo investiga el agente (skill `agente-perfilador`).
  - Si el vehículo no aparece, se registra con texto libre (`catalogoLineaId = null`).
- Filas genéricas ("LINEAS Y CILINDRAJES NO INCLUIDOS ANTERIORES A AÑO BASE", "SIN LINEA", cilindraje 1): se cargan con `es_generica = true` y no se muestran en la búsqueda.

## 3. Esquema (esquema `catalogo`)

El SQL completo está en `references/esquema-catalogo.sql` y en el backend va como migración Flyway. Resumen:

- `catalogo.marca`: `nombre`, `nombre_normalizado` (único, sin tildes y en minúsculas), `tipo` (`CARRO`, `MOTO`, `AMBOS`).
- `catalogo.linea`: `marca_id`, `nombre`, `nombre_normalizado`, `clase`, `tipo_vehiculo`, `tabla_origen`, `cilindrada_cc`, `potencia_kw`, `combustible`, `transmision`, `traccion`, `puertas`, `pasajeros`, `tonelaje`, `es_generica`, `codigo_mintransporte`, `anio_fiscal`, `avaluos_miles` (jsonb por año).
- Índice trigram sobre `nombre_normalizado` para buscar "prado" dentro de la marca.
- RLS activado y sin políticas. Ocupa unos 15 MB.

El avalúo no se usa en el MVP; se guarda porque viene gratis y sirve después (estimar el impuesto vehicular).

## 4. Importar

```bash
python3 -m pip install openpyxl
python3 ${CLAUDE_PLUGIN_ROOT}/skills/catalogo-vehiculos/scripts/importar_catalogo.py \
  --salida salida_catalogo/ "Tabla 1.- Automóviles.xlsx" "Tabla 2.- Camionetas y Camperos.xlsx" ...
```

El script detecta solo el encabezado y los años, normaliza nombres, descarta duplicados exactos, marca las filas genéricas, infiere los campos del punto 2 y escribe `marca.csv`, `linea.csv` y `resumen.json`. Al final imprime los `\copy` para Supabase en orden:

```bash
psql "$WEVEH_DB_URL" -c "\copy catalogo.marca(...) from 'salida_catalogo/marca.csv' csv header"
psql "$WEVEH_DB_URL" -c "\copy catalogo.linea(...) from 'salida_catalogo/linea.csv' csv header"
# y el ajuste de secuencias
```

La cadena de conexión nunca va al repo.

Resultado con las 5 tablas de 2025: 508 marcas, 11.583 líneas (283 genéricas), 22 duplicadas descartadas. Revisa en `resumen.json`:
- `marcas_parecidas_para_revisar` (por ejemplo `accura / acura`, `studebacker / studebaker`). No se fusionan solas: si son la misma, corrige el nombre en el Excel o agrega un alias y vuelve a correr.
- `duplicadas_con_avaluo_distinto`: misma marca, línea y cilindrada con avalúos distintos. Se conserva la primera.

Para actualizar al siguiente año fiscal: corre el script con las tablas nuevas y carga en tablas nuevas o con `truncate` dentro de una transacción. Los vehículos guardan marca, línea y cilindrada como texto además del id, así que un cambio de ids no los rompe.

## 5. API para el registro

| Endpoint | Respuesta |
|---|---|
| `GET /api/v1/catalogo/marcas?tipo=CARRO&q=toy` | Marcas que coinciden (incluye las `AMBOS`) |
| `GET /api/v1/catalogo/marcas/{id}/lineas?q=prado vx` | Líneas no genéricas de la marca: nombre, cilindrada, clase y campos inferidos |

Búsqueda sin tildes y sin mayúsculas sobre `nombre_normalizado`; cada palabra de `q` debe aparecer (`prado vx` encuentra "PRADO VX 5P AT"). Máximo 50 resultados, ordenados por nombre y cilindrada. La app guarda en caché las marcas.

Flujo en la app: tipo → marca → línea (muestra "PRADO VX 5P AT · 3.400 cc") → año modelo → confirmar o corregir combustible, transmisión y tracción sugeridos.

## 6. Relación con la IA

El catálogo dice qué vehículo es; no trae planes de mantenimiento. La ficha técnica la investiga el agente perfilador con marca, línea, año y cilindrada como consulta. Al modelo nunca se le pasa el avalúo.
