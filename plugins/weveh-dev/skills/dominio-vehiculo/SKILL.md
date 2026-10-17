---
name: dominio-vehiculo
description: Modelo de dominio y reglas de negocio de WEVEH (registro de vehículo, plan de mantenimiento por pieza, salud, SOAT/RTM/seguro, tanqueadas y consumo km/gal, kilometraje). Úsala al implementar o probar cualquier cálculo o entidad del garaje, mantenimiento, documentos o combustible, en Java o TypeScript.
---

> **Cambios vigentes (2026-10-10, ver `docs/requisitos/`):** el registro solo exige tipo, marca, línea, año y km; aceite, SOAT y RTM son opcionales y se completan después (RF-GAR-02, 02b). Si el aceite es desconocido, se recomienda revisarlo con pasos claros. El puntaje de salud solo se muestra con datos suficientes (RF-MAN-03). Los avisos de documentos son insistentes: 30, 7, 3 y 1 día, el día, y diarios si venció (RF-DOC-04).

# Dominio del vehículo

El modelo de datos vigente está en `docs/datos.md` (tablas reales y futuras). `references/modelo-dominio.md` es el diseño original: úsalo como guía de las entidades futuras, no como fuente de las tablas.

## 1. Registro del vehículo (formulario básico)

Pantalla por pasos, cada paso enciende una "luz" como en el mockup de registro.

| Paso | Campos | Obligatorio |
|---|---|---|
| 1. Tu vehículo | tipo (carro/moto) → marca → línea (búsqueda en `catalogo`, ej. "PRADO VX 5P AT · 3.400 cc") → año modelo (lista aparte) → confirmar combustible, transmisión y tracción sugeridos | Sí. Si no aparece: texto libre con `catalogoLineaId = null` y aviso "Lo revisaremos" |
| 2. Cómo está hoy | kilometraje actual, uso (ciudad/carretera/mixto), km promedio al mes (estimado) | km sí; uso y km/mes opcionales (por defecto mixto y 1.000 km/mes) |
| 3. Lo último que le hiciste | último cambio de aceite: km y fecha | Sí; si no sabe, "No sé" ⇒ pieza `SIN_DATO` |
| 4. Papeles | fecha de expedición del SOAT, fecha de la última RTM o "aún no aplica", fecha de matrícula, seguro todo riesgo (fecha de inicio, aseguradora) | SOAT y RTM sí; seguro opcional; matrícula opcional (si falta, se pregunta cuando se necesite para la RTM) |
| 5. Cómo lo llamas | alias ("La Prado"), placa | Opcionales |

No preguntes el nivel actual de combustible: no sirve para mantenimiento y cambia a diario. Al terminar se ofrece **"Completar perfil con WEVEH"** (skill `agente-perfilador`).

Ejemplo de referencia: Toyota Prado J95 VX 2008, motor 3.4 V6, 190.000 km, aceite a los 188.000 km el 2026-06-05, RTM 2026-06-28, SOAT 2026-06-30, todo riesgo 2026-07-05.

## 2. Plan de mantenimiento por pieza

Cada `PiezaPlan` tiene `intervaloKm` y/o `intervaloMeses`, `esSeguridad`, `ultimoServicioKm`, `ultimoServicioFecha` y `origen` (`FABRICANTE_VERIFICADO`, `IA_WEB` + `fuenteUrl`, `USUARIO`, `GENERICO`).

Plan genérico inicial (se reemplaza por el investigado cuando el usuario lo confirma): aceite y filtro de aceite, filtro de aire, filtro de combustible, líquido de frenos, pastillas, refrigerante, bujías, correa o cadena de distribución, batería, llantas/rotación; en moto además cadena de transmisión. Los intervalos genéricos se marcan "Recomendación general" en la UI.

### Consumo de una pieza
```
porKm     = (kmActual - ultimoServicioKm) / intervaloKm        si hay ambos datos
porTiempo = mesesEntre(ultimoServicioFecha, hoy) / intervaloMeses  si hay ambos datos
consumo   = max(porKm, porTiempo)   ; null si ninguno existe
```

### Estado
| Condición | Estado | Texto UI |
|---|---|---|
| consumo == null | `SIN_DATO` | "No sabemos cuándo se hizo" |
| consumo < 0.85 | `AL_DIA` | "Faltan N km" o "Faltan N meses" (lo que llegue primero) |
| 0.85 ≤ consumo < 1 | `POR_VENCER` | "Ya casi toca" |
| consumo ≥ 1 | `VENCIDO` | "Se pasó por N km" o "Se pasó por N meses" |

Próximo servicio: `ultimoServicioKm + intervaloKm` y `ultimoServicioFecha + intervaloMeses`; mostrar el que ocurra primero según el km/mes estimado.

## 3. Salud del vehículo (0-100)

1. Puntos por pieza: `AL_DIA` 100, `POR_VENCER` 60, `VENCIDO` 10, `SIN_DATO` 50.
2. Peso: 2 si `esSeguridad` (frenos, llantas, dirección, distribución), 1 en otro caso.
3. `bruto = Σ(peso·puntos) / Σ(peso)`.
4. Banda por el peor estado: pieza de seguridad vencida o documento vencido ⇒ "Atención" [0-39]; cualquier `VENCIDO` ⇒ "Revisar" [40-69]; `POR_VENCER` ⇒ "Pronto" [70-89]; resto ⇒ "Al día" [90-100]. El resultado es `bruto` acotado a la banda.

Un vehículo con una pieza de seguridad vencida nunca sale verde.

## 4. Documentos

| Documento | Vencimiento | Notas |
|---|---|---|
| SOAT | fecha de expedición + 1 año | |
| RTM | fecha de la última revisión + 1 año | Si "aún no aplica": primera RTM a los 5 años de la matrícula para carros particulares y a los 2 años para motos (Decreto 019 de 2012, art. 202). Confirmar la norma vigente antes de mostrarla como dato legal |
| Seguro todo riesgo | fecha de inicio + 1 año (editable) | Opcional |

Estado: `VIGENTE` (> 30 días), `POR_VENCER` (≤ 30 días), `VENCIDO` (< 0). Ventanas de aviso: 30, 7 y 1 día.

## 5. Kilometraje

- `Kilometraje` es value object: 0 ≤ km ≤ 2.000.000.
- Nunca decrece: si el nuevo valor es menor, error `KilometrajeDecreciente` (409).
- Salto anómalo: más de `max(3 × kmPromedioDia × diasDesdeUltimo, 1.500)` km ⇒ la app pide confirmación antes de guardar.
- Cada actualización queda en `RegistroKilometraje` (fecha, km, origen: manual, servicio, tanqueada); de ahí se recalcula el km promedio al mes.

## 6. Tanqueadas y consumo

`Tanqueada`: fecha, km, galones, valor COP (opcional), `tanqueLleno` (bool), tipo de combustible.

- **Método de tanque lleno**: el consumo solo se calcula entre dos tanqueadas con `tanqueLleno = true`.
  `kmPorGalon = (km del lleno actual − km del lleno anterior) / Σ galones de todas las tanqueadas posteriores al lleno anterior, incluido el actual`.
- La primera tanqueada llena solo fija la línea base: la UI dice "Con tu próximo tanque lleno te mostramos el consumo".
- **¿Es normal?** Se compara con `consumoReferencia` (ciudad/carretera/mixto en km/gal) de la ficha técnica (investigada por el agente o del catálogo) según el uso del vehículo:
  - ≥ 90 % de la referencia ⇒ "Normal".
  - 75-90 % ⇒ "Un poco alto" (sugerir presión de llantas, filtro de aire, estilo de manejo).
  - < 75 % ⇒ "Consumo alto" y evento `ConsumoAnomalo`; ofrecer preguntarle al Mecánico IA.
  - Sin referencia ⇒ comparar con el promedio de las últimas 3 mediciones del mismo vehículo.
- Costo por km = valor COP / km recorridos, cuando hay valor.

## 7. Vectores de prueba compartidos

Toda fórmula de este archivo tiene casos en `contracts/vectores-<tema>.json` (`estado-pieza`, `salud`, `vencimientos`, `consumo`) con forma `{ "descripcion", "vectores": [{ "caso", "entrada", "esperado" }] }`. Las pruebas de Java (JUnit parametrizado) y de TypeScript (Jest `test.each`) leen el mismo archivo. Si cambias una regla, cambia el vector primero.
