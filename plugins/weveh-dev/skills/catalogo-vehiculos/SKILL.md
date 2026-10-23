---
name: catalogo-vehiculos
description: Cómo cargar a Supabase (PostgreSQL) las tablas de base gravable del Ministerio de Transporte que usa WEVEH como catálogo de vehículos de Colombia, su esquema, sus limitaciones y la búsqueda marca → línea para el registro. Úsala al importar o actualizar el catálogo, crear sus tablas o endpoints, o construir el selector de vehículo en la app.
---

> **Vigente (2026-10-10):** el catálogo es una base viva por año fiscal (ADR 0014): las líneas se actualizan y agregan, nunca se borran, y la importación será un proceso repetible del backend. Los Excel van en `datos/mintransporte/<año>/` y la salida en `datos/catalogo/<año>/` (ignoradas por git). Sin `psql` instalado, la carga puede hacerse con un script de Python (psycopg) que lea las credenciales de `backend/.env`.

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
- **No**: en qué años se vendió cada línea (casi todas traen valor en los 25 años porque es una proyección), versión separada, **columnas de combustible, transmisión o tracción**, código de motor, modelos 2025 en adelante ni anteriores a 2000.
- Por eso:
  - El **año modelo** se pide aparte (lista de 1950 al año siguiente al actual), no se filtra desde el catálogo.
  - Combustible, transmisión, tracción y puertas salen en dos capas (ADR 0021, abajo). Nulo = **sin dato**: la app pregunta, nunca rellena (RF-CAT-04).
  - El código de motor, el sistema de distribución y lo demás lo investiga el agente (skill `agente-perfilador`).

### Capa 0 · reglas del nombre y la clase (`origen = CATALOGO`)

Funciones `inferir_combustible`, `inferir_transmision` e `inferir_traccion` de `scripts/importar_catalogo.py`, con pruebas en `scripts/test_importar_catalogo.py` (`python -m unittest discover -s plugins/weveh-dev/skills/catalogo-vehiculos/scripts`):

| Atributo | Regla |
|---|---|
| Combustible | Eléctrico si trae potencia en kW o la clase dice ELECTRIC*. Híbrido si es la tabla 9 o el nombre dice HEV/HYBRID/HIBRIDO; enchufable si dice PHEV, E-TRON, E-HYBRID o (BMW/Mercedes) termina en número+E (330E). Diésel por códigos de motor (DIESEL, DSL, TDI, CRDI, CDI, HDI, TDCI, JTD, BLUETEC…) o, solo en BMW y Mercedes, número+D (120D, XDRIVE30D, "200 D"). Gas: GNV, GLP. Gasolina **solo con evidencia**: TFSI, TSI, FSI, CGI, GTI, JTS, VTEC, MPI, GDI… o BMW número+I (118I). "D" + número (Audi "A8 D4") es la generación, no diésel |
| Combustible en motos | MOTOCICLETA, CICLOMOTOR y CUATRIMOTO no eléctricas → gasolina. MOTOCARRO solo si dice DIESEL o trae la "D" suelta (CAMELLITO RE205 D) |
| Transmisión | AT, **TP** (nunca aparece con AT ni MT; decidido el 2026-10-21), CVT, TIPTRONIC, STEPTRONIC, S-TRONIC, DSG, DCT, SELESPEED, POWERSHIFT, DUALOGIC, PDK… → automática; MT, MEC → mecánica. Si hay de los dos, gana la última ("MTK MT 150T AT") |
| Tracción | QUATTRO, 4MATIC, XDRIVE, 4MOTION, ALL4, SH-AWD, ALLGRIP, S-AWC, AWD → AWD; 4X4, 4WD → 4X4; 4X2, 2WD, FWD, RWD, SDRIVE → 4X2. Si la línea dice 4X4 **y** 4X2 ("FRONTIER… 4X4 4X2"), queda sin dato |

Cobertura de las líneas no genéricas de 2025 (combustible / transmisión / tracción): carros de 3,6 / 51,1 / 11,8 % a **11,3 / 62,6 / 15,0 %**; motos de 3,6 / 39,4 / 3,0 % a **90,3 / 39,5 / 3,0 %**. Las 855 líneas "(LINEA BASE ESTANDAR)" no traen variante, por eso la transmisión no sube más. El `resumen.json` trae la cobertura por tipo y por tabla (RF-CAT-05).

### Capa 1 · investigación por familia con fuente (`origen = IA_WEB`)

Lo que el nombre no dice se investiga por **familia** (marca + primera palabra de la línea; 1.673 de carro) y se responde **por cilindrada** (marca + modelo + cilindrada separa el motor: solo 1 de 3.654 grupos mezcla diésel y gasolina). Orden: familias más vendidas en Colombia. Cada dato lleva URL, cita y tipo de fuente; se acepta con una fuente FABRICANTE o CONCESIONARIO, o con dos de dominios distintos (un FORO nunca solo). El equipo revisa el 10 % de cada lote. Se guarda en `catalogo.atributo_linea` (`linea_id`, `atributo`, `valores[]`, `origen`, `fuente_url`, `cita`, `tipo_fuente`, `verificada`, `revisado_en`, `lote`), sin tocar `catalogo.linea`: la capa 0 gana y un lote malo se deshace con `delete … where lote = …`. El agente perfilador (fase 4) escribe en la misma tabla.
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
  --salida datos/catalogo/2025/ datos/mintransporte/2025/*.xlsx
```

El script detecta solo el encabezado y los años, normaliza nombres, descarta duplicados exactos, marca las filas genéricas, infiere los campos del punto 2 y escribe `marca.csv`, `linea.csv` y `resumen.json`. Al final imprime los `\copy` para Supabase en orden:

```bash
psql "$WEVEH_DB_URL" -c "\copy catalogo.marca(...) from 'datos/catalogo/2025/marca.csv' csv header"
psql "$WEVEH_DB_URL" -c "\copy catalogo.linea(...) from 'datos/catalogo/2025/linea.csv' csv header"
# y el ajuste de secuencias
```

La cadena de conexión nunca va al repo.

Resultado con las 5 tablas de 2025: 508 marcas, 11.583 líneas (283 genéricas), 22 duplicadas descartadas. Revisa en `resumen.json`:
- `marcas_parecidas_para_revisar` (por ejemplo `accura / acura`, `studebacker / studebaker`). No se fusionan solas: si son la misma, corrige el nombre en el Excel o agrega un alias y vuelve a correr.
- `duplicadas_con_avaluo_distinto`: misma marca, línea y cilindrada con avalúos distintos. Se conserva la primera.

Para actualizar al siguiente año fiscal: corre el script con las tablas nuevas y carga en tablas nuevas o con `truncate` dentro de una transacción. Los vehículos guardan marca, línea y cilindrada como texto además del id, así que un cambio de ids no los rompe.

### Actualizar los atributos del catálogo ya cargado (capa 0)

```bash
python scripts/catalogo/actualizar_atributos.py datos/mintransporte/2025/*.xlsx
# → datos/catalogo/2025/actualizar_atributos.sql
```

No se conecta a la base. El `.sql` se corre en Supabase **después de V8** (amplía el CHECK de combustible). Empareja por la clave única de V2 (no por id), aborta todo si alguna línea no existe en la base, solo cambia filas cuyo valor es distinto y termina con la consulta de cobertura.

### Cargar un lote de la capa 1

```bash
python scripts/catalogo/validar_lote.py lote.jsonl --lote piloto-2026-10 --excel datos/mintransporte/2025/*.xlsx [--verificar-urls]
# → datos/catalogo/lotes/<lote>/carga.sql y muestra_revision.json
```

Valida enums, fuentes (regla de aceptación), que la familia y la cilindrada existan y que no contradiga la capa 0; elige el 10 % para revisión e imprime el `update … set verificada = true` que se corre cuando el equipo aprueba la muestra.

## 5. API para el registro

| Endpoint | Respuesta |
|---|---|
| `GET /api/v1/catalogo/marcas?tipo=CARRO&q=toy` | Marcas que coinciden (incluye las `AMBOS`) |
| `GET /api/v1/catalogo/marcas/{id}/lineas?q=prado vx` | Líneas no genéricas de la marca: nombre, cilindrada, clase y campos inferidos |

Búsqueda sin tildes y sin mayúsculas sobre `nombre_normalizado`; cada palabra de `q` debe aparecer (`prado vx` encuentra "PRADO VX 5P AT"). Máximo 50 resultados, ordenados por nombre y cilindrada. La app guarda en caché las marcas.

Flujo en la app: tipo → marca → línea (muestra "PRADO VX 5P AT · 3.400 cc") → año modelo → confirmar o corregir combustible, transmisión y tracción sugeridos.

## 6. Relación con la IA

El catálogo dice qué vehículo es; no trae planes de mantenimiento. La ficha técnica la investiga el agente perfilador con marca, línea, año y cilindrada como consulta. Al modelo nunca se le pasa el avalúo.
