# Contrato de la API

Qué puede pedir la app al backend, qué debe enviar y qué recibe. Es el acuerdo entre las dos partes: si el backend lo cumple, cualquier app (la de Expo u otra futura) funciona sin adivinar. La versión formal es `contracts/openapi.yaml`, generada desde el código ([ADR 0012](adr/0012-contrato-api.md)).

**Estados:** ✅ existe · ⬜ decidido, por construir · 🔜 fase futura. Revisado el 2026-10-10.

## Reglas comunes

### Dirección y versión

- Base: `https://<servidor>/api/v1` (local: `http://localhost:8080/api/v1`; emulador Android: `http://10.0.2.2:8080/api/v1`).
- La versión va en la ruta. Agregar un campo opcional no cambia la versión; quitar o cambiar el significado de algo crea `/api/v2`.

### Quién eres

| Hoy | Con cuentas (ADR 0005) |
|---|---|
| Header `X-Weveh-Dispositivo: <UUID v4>`. Sin él o inválido → 400 | Header `Authorization: Bearer <token de Supabase Auth>`. Sin él, vencido o alterado → 401 |

Todo se filtra por la persona: un recurso ajeno responde **404** (no 403), para no revelar que existe.

### Formato

- JSON en UTF-8. Nombres de campos en `camelCase` y español (`anioModelo`, `kilometraje`).
- Fechas en ISO `AAAA-MM-DD` (`"2026-06-30"`). Números sin separadores de miles.
- Valores fijos en mayúsculas: `CARRO`, `MOTO`, `CIUDAD`, `CARRETERA`, `MIXTO`, `GASOLINA`, `DIESEL`, `HIBRIDO`, `ELECTRICO`, `AUTOMATICA`, `MECANICA`, `4X2`, `4X4`, `AWD`.

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
| 400 | `dispositivo-invalido` | Falta o es inválido `X-Weveh-Dispositivo` (desaparece con las cuentas) |
| 400 | `dato-invalido` | Una regla de negocio o un formato no se cumple |
| 401 | `no-autenticado` ⬜ | Falta el token, venció o fue alterado |
| 404 | `no-encontrado` | No existe o es de otra persona |
| 409 | `conflicto` | El cambio choca con el estado actual |
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
  "combustible": null, "transmision": "AUTOMATICA", "traccion": null, "puertas": 5
}]
```

`combustible`, `transmision` y `traccion` son sugerencias inferidas del nombre (null = sin pista).

## Garaje ✅

### `GET /vehiculos`

Los vehículos de la persona, del más antiguo al más reciente. `[]` si no tiene.

### `POST /vehiculos`

Registra un vehículo. **Hoy** exige `soatFecha`, y `rtmFecha` o `rtmAunNoAplica`; **con RF-GAR-02** solo son obligatorios `tipo`, `marca`, `linea`, `anioModelo` y `kilometraje`.

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
  "fechaMatricula": null, "kilometraje": 190000, "uso": "MIXTO", "kmPromedioMes": 1000, "versionFila": 0
}
```

Sin `catalogoLineaId` se registra con texto libre ("Lo revisaremos"). La placa se normaliza (sin espacios ni guiones, en mayúsculas).

### `GET /vehiculos/{id}` · `DELETE /vehiculos/{id}`

Ver uno (200) o eliminarlo con todo lo suyo (204). Ajeno o inexistente → 404.

### `PUT /vehiculos/{id}`

Edita `alias`, `placa`, `uso`, `kmPromedioMes` y `fechaMatricula`, enviando la `versionFila` que tenía la app. **Hoy** responde 409 si la versión cambió; **con ADR 0009** gana el cambio más reciente si cumple las reglas.

### ⬜ `PUT /vehiculos/{id}/kilometraje` (RF-GAR-05)

Actualiza el km. Nunca baja (400); un salto anómalo exige `confirmado: true`.

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
  "explicacionSimple": "…",
  "accionInmediata": "…",
  "costoEstimado": "$300.000 - $600.000 COP",
  "requiereRevisionHumana": false,
  "requiereMecanico": true,
  "piezasRelacionadas": ["cadena_distribucion", "tensores_cadena"],
  "datosFaltantes": [],
  "respuestaSegura": false,
  "aviso": "Orientación, no reemplaza al mecánico"
}
```

`nivel` es el código para la app (color); `gravedad` el texto del contrato. Errores: 400 (síntoma vacío o > 1.000 caracteres), 404, 409 (límite diario, hoy), 503 (IA no configurada).

**Cambios decididos ⬜:**
- Sin `costoEstimado` en la respuesta; la estructura pasa a "qué puede ser / por qué importa / qué hacer (máx. 3 pasos)". El costo se pide con `POST /vehiculos/{id}/consultas/{consultaId}/costo` (RF-MIA-01b).
- Conversación: `POST /vehiculos/{id}/conversaciones` y `POST /conversaciones/{id}/mensajes`; `GET` para retomarlas (RF-MIA-02).
- Cupo: el límite pasa a 429 `limite-de-uso` con cuándo vuelve a haber; `GET /cuenta/cupo` para mostrarlo en Perfil (RF-MIA-07).

## Cuentas y datos ⬜ (ADR 0005, RF-CTA, RF-DAT)

El registro, el inicio de sesión, Google, el enlace mágico y la recuperación los hace la app directo con **Supabase Auth**. La API agrega:

| Endpoint | Para qué |
|---|---|
| `GET /cuenta` | Nombre, correo y consentimientos (RF-DAT-04) |
| `PUT /cuenta` | Corregir el nombre (RF-DAT-05) |
| `POST /cuenta/consentimientos` | Registrar la aceptación de una versión de la política (RF-DAT-02/03) |
| `DELETE /cuenta` | Eliminar la cuenta y todo lo suyo; exige identidad confirmada hace poco (RF-DAT-06) |
