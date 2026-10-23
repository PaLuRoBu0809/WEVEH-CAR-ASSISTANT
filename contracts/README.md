# Contratos compartidos

| Archivo | Qué es | Quién lo lee |
|---|---|---|
| `openapi.yaml` | Contrato HTTP de la API, se completa por fase | Backend (pruebas de controladores) y app (tipos del cliente) |
| `vectores-estado-pieza.json` | Consumo y estado de una pieza del plan, incluido "Sin dato · revisar ya" | JUnit y Jest |
| `vectores-salud.json` | Salud 0-100, banda y si hay datos suficientes para mostrar el puntaje | JUnit y Jest |
| `vectores-vencimientos.json` | Vencimiento y estado de SOAT, RTM y seguro | JUnit y Jest |
| `vectores-consumo.json` | km/gal, costo por km y clasificación | JUnit y Jest |

Forma de cada archivo de vectores:

```json
{
  "descripcion": "regla exacta que implementan los vectores",
  "vectores": [{ "caso": "...", "entrada": { }, "esperado": { } }]
}
```

Reglas:
- La `descripcion` de cada archivo es la especificación precisa (redondeos, bordes, cómo contar meses). Las fórmulas generales están en la skill `weveh-dev:dominio-vehiculo`.
- Las fechas van en ISO (`AAAA-MM-DD`) y cada vector trae su `hoy`, para que las pruebas no dependan del reloj.
- Los consumos de pieza se comparan con tolerancia `1e-4`. La razón de consumo de combustible se calcula con el km/gal **sin** redondear.
- Si una regla cambia, se cambia primero el vector y luego Java y TypeScript, en el mismo PR.

## Cambios del 2026-10-21 (RF-MAN-02, RF-MAN-03, ADR 0016)

Todavía ningún código lee estos vectores; se ajustaron antes de construir el módulo `mantenimiento`.

- **Estado de pieza:** nuevo estado `SIN_DATO_REVISAR_YA` para una pieza de seguridad sin último servicio cuyo kilometraje llegó al margen del fabricante. Entradas opcionales nuevas:
  - `esSeguridad` (por defecto `false`).
  - `margenKm` (por defecto `null`, que equivale al 100 % de `intervaloKm`, D-04).
  
  Los vectores anteriores no las traen y siguen valiendo igual.
- **Salud:** `SIN_DATO_REVISAR_YA` vale 50 puntos como `SIN_DATO`, pero limita la banda a `REVISAR`.
  - El caso que dejaba "sin dato de seguridad" en `AL_DIA` 90 se separó en dos: bajo el margen sigue en `AL_DIA`; pasado el margen queda en `REVISAR`.
  - Salida nueva `datosSuficientes`: más de la mitad de las piezas con dato (D-02). Sin datos suficientes no hay puntaje ni banda, salvo `ATENCION`, que siempre se muestra.
