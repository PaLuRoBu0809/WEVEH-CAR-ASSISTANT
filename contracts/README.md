# Contratos compartidos

| Archivo | Qué es | Quién lo lee |
|---|---|---|
| `openapi.yaml` | Contrato HTTP de la API, se completa por fase | Backend (pruebas de controladores) y app (tipos del cliente) |
| `vectores-estado-pieza.json` | Consumo y estado de una pieza del plan | JUnit y Jest |
| `vectores-salud.json` | Salud 0-100 y banda | JUnit y Jest |
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
