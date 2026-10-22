# Contrato de la API

Qué puede pedir la app al backend, qué debe enviar y qué recibe. Es el acuerdo entre las dos partes: si el backend lo cumple, cualquier app (la de Expo u otra futura) funciona sin adivinar. La versión formal es `contracts/openapi.yaml`, generada desde el código ([ADR 0012](adr/0012-contrato-api.md)).

**Estados:** ✅ existe · ⬜ decidido, por construir · 🔜 fase futura. Revisado el 2026-10-10.

## Reglas comunes

### Dirección y versión

- Base: `https://<servidor>/api/v1` (local: `http://localhost:8080/api/v1`; emulador Android: `http://10.0.2.2:8080/api/v1`).
- La versión va en la ruta. Agregar un campo opcional no cambia la versión; quitar o cambiar el significado de algo crea `/api/v2`.

### Quién eres

Header `Authorization: Bearer <token de Supabase Auth>` en toda ruta `/api/**` (ADR 0005). El backend valida la firma (ES256, JWKS del proyecto), el emisor, la audiencia `authenticated` y el vencimiento. Sin token, vencido o alterado → 401 `no-autenticado`.

Todo se filtra por la persona: un recurso ajeno responde **404** (no 403), para no revelar que existe.

### Formato

- JSON en UTF-8. Nombres de campos en `camelCase` y español (`anioModelo`, `kilometraje`).
- Fechas en ISO `AAAA-MM-DD` (`"2026-06-30"`). Números sin separadores de miles.
- Valores fijos en mayúsculas: `CARRO`, `MOTO`, `CIUDAD`, `CARRETERA`, `MIXTO`, `GASOLINA`, `DIESEL`, `GAS`, `HIBRIDO`, `HIBRIDO_ENCHUFABLE`, `ELECTRICO`, `AUTOMATICA`, `MECANICA`, `4X2`, `4X4`, `AWD`.

### Errores (Problem Details, RFC 9457)

Todo error tiene la misma forma; la app muestra `detail` tal cual porque está escrito para la persona:

```json
{
  "type": "https://weveh.co/problemas/dato-invalido",
  "title": "Revisa los datos",
  "status": 400,
  "detail": "El kilometraje debe ser mayor o igual a cero",
  "instance": "/api/v1/vehiculos"
}
```

| HTTP | `type` | Cuándo |
|---|---|---|
| 400 | `dato-invalido` | Una regla de negocio o un formato no se cumple |
| 401 | `no-autenticado` | Falta el token, venció o fue alterado |
| 401 | `identidad-no-confirmada` | Eliminar la cuenta con una sesión de más de 5 minutos: hay que volver a iniciar sesión (RF-CTA-05) |
| 404 | `no-encontrado` | No existe o es de otra persona |
| 409 | `conflicto` | El cambio choca con el estado actual |
| 409 | `confirmacion-requerida` | El cambio es raro y hay que confirmarlo (salto del kilometraje); `detail` trae la pregunta |
| 429 | `limite-de-uso` ⬜ | Se agotó el cupo del Mecánico IA (dice cuándo vuelve a haber) |
| 503 | `no-disponible` | La IA no está configurada, está caída (cortacircuitos) o el módulo está apagado |

### Cambios hechos sin red ⬜

Las escrituras aceptan `Idempotency-Key: <UUID>` (la misma petición repetida se aplica una sola vez) y la hora del cambio, para resolver conflictos con "gana lo último" (ADR 0009).

## Catálogo ✅

### `GET /catalogo/marcas?tipo=CARRO&q=toy`

Busca marcas sin tildes ni mayúsculas; cada palabra de `q` debe aparecer. Incluye las de tipo `AMBOS`. Máximo 50.

```json
[{ "id": 145, "nombre": "TOYOTA", "tipo": "AMBOS" }]
```

### `GET /catalogo/marcas/{marcaId}/lineas?tipo=CARRO&q=prado vx`

Líneas reales (sin genéricas) de la marca, ordenadas por nombre y cilindrada. Máximo 50.

```json
[{
  "id": 7811, "marcaId": 145, "nombre": "PRADO VX 5P AT", "clase": "CAMIONETAS Y CAMPEROS",
  "tipoVehiculo": "CARRO", "cilindradaCc": 3400, "potenciaKw": null,
  "combustible": null, "transmision": "AUTOMATICA", "traccion": null, "puertas": 5,
  "atributos": {
    "combustible": { "valores": ["GASOLINA"], "origen": "IA_WEB", "fuente": "https://www.toyota.com.co/prado" },
    "transmision": { "valores": ["AUTOMATICA"], "origen": "CATALOGO", "fuente": null },
    "traccion": { "valores": ["4X2", "4X4"], "origen": "IA_WEB", "fuente": "https://www.toyota.com.co/prado" }
  }
}]
```

`atributos` dice cada atributo y de dónde sale (RF-CAT-04, ADR 0021); es lo que debe usar la app. Cada uno es `null` cuando no hay dato, y entonces la app pregunta con "No sé".

| `origen` | Qué significa | La app |
|---|---|---|
| `CATALOGO` | Lo dice el nombre de la línea del Ministerio | No pregunta; "Dato de WEVEH · Corregir" |
| `IA_WEB` | Investigado por familia en la web, verificado y con `fuente` | No pregunta; "Dato de WEVEH · según [fuente] · Corregir" |
| `EQUIPO` | Corregido por el equipo | Igual que `IA_WEB` |

Varios `valores` significan que el modelo se vende en varias versiones: la app pregunta solo entre ellos. Gana el nombre de la línea; luego lo del equipo; luego lo de la web verificado. Los campos sueltos `combustible`, `transmision` y `traccion` se conservan por compatibilidad y solo traen lo deducido del nombre.

## Garaje ✅

### `GET /vehiculos`

Los vehículos de la persona, del más antiguo al más reciente. `[]` si no tiene.

### `POST /vehiculos`

Registra un vehículo. Solo son obligatorios `tipo`, `marca`, `linea`, `anioModelo` y `kilometraje` (RF-GAR-02); el aceite y los papeles pueden quedar para después y la respuesta los lista en `datosFaltantes` (RF-GAR-02b).

```json
{
  "tipo": "CARRO", "catalogoLineaId": 7811, "marca": "TOYOTA", "linea": "PRADO VX 5P AT",
  "cilindradaCc": 3400, "anioModelo": 2008, "combustible": "GASOLINA", "transmision": "AUTOMATICA",
  "traccion": "4X4", "kilometraje": 190000, "uso": "MIXTO", "kmPromedioMes": 1000,
  "aceiteKm": 188000, "aceiteFecha": "2026-06-05", "soatFecha": "2026-06-30",
  "rtmFecha": "2026-06-28", "rtmAunNoAplica": false,
  "fechaMatricula": null, "seguroInicio": null, "seguroEntidad": null,
  "alias": "La Prado", "placa": "abc 123"
}
```

Respuesta **201** con header `Location: /api/v1/vehiculos/{id}` y el vehículo:

```json
{
  "id": "7a1c9a2e-…", "tipo": "CARRO", "catalogoLineaId": 7811, "alias": "La Prado",
  "marca": "TOYOTA", "linea": "PRADO VX 5P AT", "cilindradaCc": 3400, "anioModelo": 2008,
  "combustible": "GASOLINA", "transmision": "AUTOMATICA", "traccion": "4X4", "placa": "ABC123",
  "fechaMatricula": null, "kilometraje": 190000, "kmActualizadoEn": "2026-10-15", "uso": "MIXTO",
  "kmPromedioMes": 1000, "aceiteKm": 188000, "aceiteFecha": "2026-06-05", "soatFecha": "2026-06-30",
  "rtmFecha": "2026-06-28", "rtmAunNoAplica": false, "seguroInicio": null, "seguroEntidad": null,
  "datosFaltantes": [], "versionFila": 0
}
```

Sin `catalogoLineaId` se registra con texto libre ("Lo revisaremos"). La placa se normaliza (sin espacios ni guiones, en mayúsculas). `datosFaltantes` puede traer `SOAT`, `RTM` (ni fecha ni "aún no aplica") y `ACEITE`.

### `GET /vehiculos/{id}` · `DELETE /vehiculos/{id}`

Ver uno (200) o eliminarlo con todo lo suyo (204). Ajeno o inexistente → 404.

### `PUT /vehiculos/{id}`

Edita `alias`, `placa`, `uso`, `kmPromedioMes`, `fechaMatricula`, `combustible`, `transmision` y `traccion` (RF-GAR-03), enviando la `versionFila` que tenía la app. `combustible`, `transmision` y `traccion` son opcionales: si no llegan (o llegan en `null`) se conservan los actuales.

```json
{ "alias": "La Prado", "uso": "MIXTO", "kmPromedioMes": 1000, "combustible": "DIESEL", "traccion": "4X4", "versionFila": 3 }
```

 **Hoy** responde 409 si la versión cambió; **con ADR 0009** gana el cambio más reciente si cumple las reglas.

### `PUT /vehiculos/{id}/registro` (RF-GAR-02b)

Completa el aceite y los papeles que quedaron para después: `aceiteKm`, `aceiteFecha`, `soatFecha`, `rtmFecha`, `rtmAunNoAplica`, `seguroInicio`, `seguroEntidad` y la `versionFila` que tenía la app. Se envían como quedan; lo vacío sigue pendiente. Mismas reglas que el registro; 409 si la versión cambió.

### `PUT /vehiculos/{id}/kilometraje` (RF-GAR-05)

```json
{ "kilometraje": 191200, "confirmado": false }
```

Nunca baja (400 "El kilometraje no puede bajar: hoy tiene 190.000 km"). Un salto mayor a `max(3 × km promedio diario × días desde la última lectura, 1.500)` sin `confirmado` responde **409 `confirmacion-requerida`** con la pregunta en `detail`; la app la muestra y reenvía con `confirmado: true`. Publica `KilometrajeActualizado`.

## Mecánico IA ✅

### `POST /vehiculos/{id}/consultas`

```json
{ "sintoma": "suena un tic-tac al encender que se quita cuando calienta" }
```

Respuesta **200**:

```json
{
  "posibleFalla": "Ruido de válvulas o de la cadena de distribución",
  "nivel": "MODERADO",
  "gravedad": "Moderado",
  "porQueImporta": "Si es la cadena y se estira, puede saltar y dañar el motor.",
  "pasos": ["Revisa el nivel de aceite.", "Llévalo al mecánico esta semana."],
  "requiereRevisionHumana": false,
  "requiereMecanico": true,
  "piezasRelacionadas": ["cadena_distribucion", "tensores_cadena"],
  "datosFaltantes": [],
  "respuestaSegura": false,
  "aviso": "Orientación, no reemplaza al mecánico"
}
```

`nivel` es el código para la app (color); `gravedad` el texto del contrato. `porQueImporta` tiene máximo 2 oraciones y `pasos` de 1 a 3, en orden; si el validador sube la gravedad a crítica, el primer paso es ir al mecánico. Todo el texto va en español: una respuesta del modelo con inglés se descarta y se prueba el siguiente modelo (prompt `mecanico-v2`). Sin precio: se pide aparte. Errores: 400 (síntoma vacío o > 1.000 caracteres), 404, 409 (límite diario, hoy), 503 (IA no configurada).

**Cambios decididos ⬜:**
- El costo se pide con `POST /vehiculos/{id}/consultas/{consultaId}/costo` (RF-MIA-01b).
- Conversación: `POST /vehiculos/{id}/conversaciones` y `POST /conversaciones/{id}/mensajes`; `GET` para retomarlas (RF-MIA-02).
- Cupo: el límite pasa a 429 `limite-de-uso` con cuándo vuelve a haber; `GET /cuenta/cupo` para mostrarlo en Perfil (RF-MIA-07).

## Cuentas y datos ✅ (ADR 0005, RF-CTA, RF-DAT)

El registro, el inicio de sesión, Google, el enlace mágico y la recuperación los hace la app directo con **Supabase Auth**. La API agrega:

| Endpoint | Para qué |
|---|---|
| `POST /cuenta` | Crear el perfil con el nombre y la aceptación de la política (RF-DAT-02). Idempotente: la app lo llama en el primer inicio de sesión. `{ nombre, versionPolitica, aceptadoEn?, medio? }`: `medio` es `APP_REGISTRO` (por defecto, casilla del registro con correo) o `APP_GOOGLE` (casilla de "Antes de entrar" la primera vez con Google); otro valor responde 400. 201 |
| `GET /cuenta` | Nombre, correo (sale del token) y consentimientos (RF-DAT-04). 404 si aún no hay perfil |
| `PUT /cuenta` | Corregir el nombre (RF-DAT-05) |
| `POST /cuenta/consentimientos` | Registrar la aceptación de una versión de la política (RF-DAT-02/03) |
| `DELETE /cuenta` | Eliminar la cuenta y todo lo suyo, aquí y en Supabase Auth; exige sesión de máximo 5 minutos (RF-DAT-06, RF-CTA-05). 204; 503 si Supabase no responde (no se borra nada) |

Registrar un vehículo sin perfil de cuenta responde 409 "Completa tu cuenta antes de registrar un vehículo".
