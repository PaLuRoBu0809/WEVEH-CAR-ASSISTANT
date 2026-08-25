# 🚗 Weveh — Asistente Automotriz con IA

> Super App vehicular que ayuda a los dueños de carros y motos a cuidar su vehículo antes de que sea demasiado tarde: mantenimiento preventivo, trámites legales y un "Mecánico IA" en el bolsillo.

**Equipo:** Equipo Salchicha
**Curso:** Makers AI Product

---

## 📌 El problema

Los dueños de vehículos —especialmente de segunda mano— tienen dificultades para gestionar el mantenimiento preventivo y los trámites legales de su carro, porque carecen de conocimientos mecánicos técnicos y no llevan un registro organizado de fechas e historial. Esto genera:

- Multas costosas por documentos vencidos (SOAT, impuestos, revisión técnico-mecánica).
- Daños mecánicos severos por descuido, que convierten un mantenimiento barato en una reparación carísima.
- Estrés constante al no saber qué significa un ruido o un testigo encendido en el tablero.

**Cómo lo resuelven hoy:** memoria, la "tarjetita de cartón" del último cambio de aceite, esperar a que el carro suene raro, o preguntar en foros y a amigos — respuestas genéricas que no consideran la marca, modelo y año exactos del vehículo.

## 💡 La solución

Weveh combina un registro organizado del vehículo con un asistente de IA que entiende lenguaje natural (texto, voz o foto) y responde como un mecánico experto, pero preventivo: en vez de esperar a que el carro falle, avisa antes.

## ✨ Funcionalidades del MVP

- **Perfil Inteligente** — specs de fábrica según marca, modelo y año del vehículo.
- **Bóveda de Vencimientos** — control de SOAT, impuestos y revisión técnico-mecánica.
- **Bitácora de Desgaste** — historial de servicios y mantenimientos realizados.
- **Mecánico IA** — núcleo de IA del producto, con tres capacidades:
  - *Triaje Mecánico*: diagnóstico preventivo a partir de la descripción del síntoma en lenguaje natural.
  - *Mantenimiento Predictivo*: recomendaciones basadas en kilometraje promedio.
  - *Asesoría de Compra*: guía sobre líquidos y repuestos adecuados para el vehículo.

## 🧠 ¿Por qué IA?

Un buscador o un manual en PDF no entienden descripciones vagas como "el carro me jalonea" o "suena un chillido al frenar". La IA puede procesar ese lenguaje informal, cruzarlo con el contexto del vehículo (marca, modelo, año, kilometraje) y dar un diagnóstico preventivo específico — actuando como un mecánico experto en el bolsillo del usuario.

Capacidades usadas:
- Extracción de información (kilometraje, gastos) desde audio o texto desordenado.
- Clasificación por gravedad (emergencia real vs. mantenimiento básico).
- Diagnóstico cruzando síntomas con fallas comunes del modelo exacto.
- Comprensión de lenguaje natural, poco técnico.

## 🔄 Flujo de la IA

1. El usuario envía un mensaje (texto, voz o foto) describiendo un síntoma.
2. El sistema valida que el perfil del vehículo (marca, modelo, año) esté completo.
3. Se agrega contexto: kilometraje estimado e historial de mantenimiento.
4. La IA identifica el componente mecánico posiblemente afectado.
5. La IA cruza el síntoma con la base de datos mecánica, genera un pre-diagnóstico y clasifica la urgencia.
6. El sistema agrega un aviso de seguridad: es una estimación, no reemplaza a un mecánico presencial.
7. El usuario recibe el diagnóstico en lenguaje sencillo, con nivel de gravedad y próximos pasos.
8. La app sugiere agendar cita en un taller aliado o registrar la reparación.

## 📤 Output estructurado: `diagnostico_mecanico_preventivo`

| Campo | Tipo | Obligatorio | Valores permitidos | Restricción |
|---|---|---|---|---|
| `posible_falla` | string | Sí | Libre | Ninguna |
| `nivel_gravedad` | string | Sí | `"Crítico"` \| `"Moderado"` \| `"Leve"` | Solo uno de estos tres valores exactos |
| `explicacion_simple` | string | Sí | Libre | Máximo 2 oraciones, sin jerga técnica |
| `accion_inmediata` | string | Sí | Libre | Instrucción directa para el usuario |
| `costo_estimado` | string \| null | No | Libre | Rango estimado; `null` si no se puede estimar de forma segura |

### Ejemplo

```json
{
  "posible_falla": "Pastillas de freno desgastadas",
  "nivel_gravedad": "Crítico",
  "explicacion_simple": "Las pastillas de freno han perdido su material de fricción y el metal está rozando directamente con el disco al frenar.",
  "accion_inmediata": "Detener el uso del vehículo y agendar cambio de pastillas inmediatamente para no dañar el disco.",
  "costo_estimado": "$150.000 - $300.000 COP"
}
```

### Prompt estructurado (base)

```
Actúa como el motor de análisis de un mecánico automotriz experto.
Devuelve únicamente JSON válido. No incluyas explicaciones ni uses markdown.
No inventes datos de costos si el problema es ambiguo. Usa null cuando el
costo no se pueda estimar de forma segura.

Estructura requerida:
{
  "posible_falla": "string, nombre del componente afectado",
  "nivel_gravedad": "string, nivel de riesgo",
  "explicacion_simple": "string, máximo 2 oraciones sin jerga técnica",
  "accion_inmediata": "string, qué debe hacer el conductor ahora mismo",
  "costo_estimado": "string o null, rango de precio referencial"
}

Valores permitidos: nivel_gravedad: "Crítico" | "Moderado" | "Leve"

Input: Vehículo: {{MARCA_MODELO_AÑO}} Síntoma: {{TEXTO_DEL_USUARIO}}
```

## ⚠️ Riesgo principal y regla de seguridad

**Riesgo:** que la IA clasifique como "Leve" un problema que en realidad es peligroso (ej. falla en dirección o frenos), llevando al usuario a seguir manejando y sufrir un accidente o daño severo.

**Caso límite detectado:** un testigo rojo de presión de aceite fue subestimado porque el usuario reportó que "el carro se sentía perfecto" — pero ese testigo puede indicar que el motor se funde en minutos.

**Regla de seguridad aplicada:**
> Cualquier mención de un testigo de color **rojo** en el tablero (especialmente aceite, temperatura o batería) o fallas en el sistema de frenos debe clasificarse **siempre** con `nivel_gravedad: "Crítico"`, sin importar si el usuario indica que el vehículo se siente o conduce de manera normal.

Además:
- Todo diagnóstico debe mostrar un *disclaimer* aclarando que es una estimación preventiva, no un reemplazo de un mecánico presencial.
- La app incluye un botón **"¿El mecánico te dijo otra cosa?"** para que el usuario ingrese el diagnóstico real y así retroalimentar el modelo.

## 📊 Criterios de éxito

- **Métrica principal:** cantidad de recordatorios legales cumplidos (SOAT renovado a tiempo) y mantenimientos registrados por mes.
- **Resultado mínimo aceptable:** 30% de los usuarios nuevos registran al menos un mantenimiento o resuelven una duda con el Mecánico IA en sus primeros 15 días.
- **Señal de valor:** el usuario abre la app *antes* de llevar el carro al mecánico, o renueva sus seguros directamente desde la app.

## 💰 Monetización

- Venta de seguros.
- Directorio de talleres aliados (pago).
- Certificado de reventa premium.

## 👥 Equipo

- Equipo Salchicha
- Pablo Luis Rodríguez Burgos

## 📄 Licencia

Por definir.
