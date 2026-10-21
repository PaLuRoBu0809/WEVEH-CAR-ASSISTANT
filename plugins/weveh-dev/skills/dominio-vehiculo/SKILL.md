---
name: dominio-vehiculo
description: Modelo de dominio y reglas de negocio de WEVEH (registro de vehículo, plan de mantenimiento por perfil y por pieza, servicios, salud, documentos y licencia, tanqueadas y consumo km/gal, kilometraje confirmado). Úsala al implementar o probar cualquier cálculo o entidad del garaje, mantenimiento, documentos o combustible, en Java o TypeScript.
---

> **Cambios vigentes (2026-10-10, ver `docs/requisitos/`):** el registro solo exige tipo, marca, línea, año y km; aceite, SOAT y RTM son opcionales y se completan después (RF-GAR-02, 02b). Si el aceite es desconocido, se recomienda revisarlo con pasos claros. El puntaje de salud solo se muestra con datos suficientes (RF-MAN-03). Los avisos de documentos son insistentes: 30, 7, 3 y 1 día, el día, y diarios si venció (RF-DOC-04).
>
> **Aprobado el 2026-10-21 (ADR 0016, 0017, 0020 y 0021):** el kilometraje es siempre el confirmado, nunca estimado; plan por perfil y en capas; estado `SIN_DATO_REVISAR_YA`; servicio como factura con varios trabajos; concepto del mecánico con precedencia; documentos ampliados y licencia por cuenta; combustible con gas e híbrido enchufable; el registro no pregunta el uso. Si algo de abajo choca con `docs/`, gana `docs/`.

# Dominio del vehículo

El modelo de datos vigente está en `docs/datos.md` (tablas reales y futuras). `references/modelo-dominio.md` es el diseño original: úsalo como guía de las entidades futuras, no como fuente de las tablas.

## 1. Registro del vehículo (formulario básico)

Pantalla por pasos, cada paso enciende una "luz" como en el mockup de registro.

| Paso | Campos | Obligatorio |
|---|---|---|
| 1. Tu vehículo | tipo (carro/moto) → marca → línea (búsqueda en `catalogo`, ej. "PRADO VX 5P AT · 3.400 cc") → año modelo (lista aparte) → combustible, transmisión y tracción **solo si el catálogo no los conoce** (RF-CAT-04, ADR 0021) | Sí. Si no aparece: texto libre con `catalogoLineaId = null` y aviso "Lo revisaremos" |
| 2. Cómo está hoy | kilometraje actual | Sí. El uso queda en `MIXTO` y el km/mes en 1.000 (solo para detectar saltos); se editan después |
| 3. Lo último que le hiciste | último cambio de aceite: km y fecha | Opcional; "No sé" ⇒ pieza `SIN_DATO` |
| 4. Papeles | fecha de expedición del SOAT, fecha de la última RTM o "aún no aplica", fecha de matrícula, seguro todo riesgo (fecha de inicio, aseguradora) | Opcionales (se recuerdan en Inicio); matrícula se pide cuando se necesite para la RTM |

**Atributos del catálogo (RF-CAT-04, ADR 0021):** combustible (`GASOLINA`, `DIESEL`, `GAS`, `HIBRIDO`, `HIBRIDO_ENCHUFABLE`, `ELECTRICO`), transmisión y tracción vienen del nombre de la línea (origen `CATALOGO`), de la investigación por familia con fuente revisada (`IA_WEB`) o de la respuesta de la persona. Si la familia se vende con varios valores, se pregunta solo entre esos. Sin dato se pregunta con "No sé"; **nunca** se rellena en silencio.
| 5. Cómo lo llamas | alias ("La Prado"), placa | Opcionales |

No preguntes el nivel actual de combustible: no sirve para mantenimiento y cambia a diario. Al terminar se ofrece **"Completar perfil con WEVEH"** (skill `agente-perfilador`).

Ejemplo de referencia: Toyota Prado J95 VX 2008, motor 3.4 V6, 190.000 km, aceite a los 188.000 km el 2026-06-05, RTM 2026-06-28, SOAT 2026-06-30, todo riesgo 2026-07-05.

## 2. Plan de mantenimiento por pieza

Cada `PiezaPlan` tiene `intervaloKm` y `intervaloMeses` (los dos cuando el manual los da; las llantas incluyen su edad), `esSeguridad`, `margenFabricante` (opcional), `ultimoServicioKm`, `ultimoServicioFecha` y `origen` (`FABRICANTE_VERIFICADO`, `IA_WEB` + `fuenteUrl`, `USUARIO`, `GENERICO`).

**Plan por perfil y en capas (ADR 0016, RF-MAN-01, 07).** La plantilla base es una tabla de datos versionada (pieza, perfiles a los que aplica por tipo, combustible, transmisión y tracción, intervalos, seguridad), no `if` en el código. Ejemplos: un eléctrico no tiene aceite, bujías ni distribución; un diésel no tiene bujías de encendido; 4x4 y AWD agregan transferencia y diferenciales; manual agrega embrague; moto agrega cadena de transmisión; híbrido y gas agregan "Revisar con el manual" sin intervalo inventado. Sobre la base, en orden: ficha del modelo investigada (propuesta hasta confirmar) → condiciones de uso (calendario severo del fabricante si existe; nunca un factor inventado) → banderas de historia (`motorCambiado`, `cambioCombustible`, `conversionGas`…: reconstruyen el perfil y dejan en `SIN_DATO` lo afectado) → lo que edita la persona o dice su mecánico. Los intervalos de la plantilla se marcan "Recomendación general" en la UI.

**Servicio como factura (ADR 0017, RF-MAN-04).** `Servicio` (fecha, km, taller, total opcional, notas, recomendaciones, foto opcional como evidencia) con `ServicioItem` (pieza, acción `CAMBIO` | `REVISION` | `AJUSTE`, especificación). **Solo `CAMBIO` reinicia el intervalo** de la pieza. Kits rápidos ("cambio de aceite" = aceite + filtro).

**Precedencia al calcular el estado de una pieza (ADR 0017, RF-MAN-11):** 1) regla de seguridad por síntomas; 2) concepto vigente del mecánico (vigencia por defecto 90 días o 3.000 km, por confirmar); 3) observación más reciente de la persona (revisión rápida, RF-MAN-10); 4) intervalo calculado.

### Consumo de una pieza
```
porKm     = (kmActual - ultimoServicioKm) / intervaloKm        si hay ambos datos
porTiempo = mesesEntre(ultimoServicioFecha, hoy) / intervaloMeses  si hay ambos datos
consumo   = max(porKm, porTiempo)   ; null si ninguno existe
```

### Estado
| Condición | Estado | Texto UI |
|---|---|---|
| consumo == null, pieza de seguridad y `kmActual` ≥ `margenFabricante` (sin ficha: el 100 % del intervalo en km) | `SIN_DATO_REVISAR_YA` | "Sin dato · revisar ya" (va a "Lo más urgente"; no se llama "Vencida") |
| consumo == null en otro caso | `SIN_DATO` | "No sabemos cuándo se hizo" |
| consumo < 0.85 | `AL_DIA` | "Faltan N km" y/o "Faltan N meses" |
| 0.85 ≤ consumo < 1 | `POR_VENCER` | "Ya casi toca" |
| consumo ≥ 1 | `VENCIDO` | "Se pasó por N km" o "Se pasó por N meses" |

Próximo servicio: `ultimoServicioKm + intervaloKm` y `ultimoServicioFecha + intervaloMeses`. Se muestran los **kilómetros que faltan** y la fecha por tiempo; **nunca** una fecha estimada a partir del km/mes (ADR 0020). El kilometraje usado es el último confirmado; si tiene más de 30 días, la UI lo dice ("calculado con el km de hace X días").

## 3. Salud del vehículo (0-100)

0. **Datos suficientes:** solo se calcula el puntaje si más de la mitad de las piezas del plan tiene dato (D-02, por confirmar). Si no, la UI muestra el estado de cada pieza y "Completa el perfil para ver la salud de tu vehículo" con las tarjetas de lo que falta.
1. Puntos por pieza: `AL_DIA` 100, `POR_VENCER` 60, `VENCIDO` 10, `SIN_DATO` 50, `SIN_DATO_REVISAR_YA` 50 (su efecto está en la banda: como mucho `REVISAR`; ver `contracts/vectores-salud.json`).
2. Peso: 2 si `esSeguridad` (frenos, llantas, dirección, distribución), 1 en otro caso.
3. `bruto = Σ(peso·puntos) / Σ(peso)`.
4. Banda por el peor estado: pieza de seguridad vencida o **cualquier documento vencido** (SOAT, RTM, seguro, extintor, impuesto, licencia o multa pendiente) ⇒ "Atención" [0-39]; cualquier `VENCIDO` o una pieza en `SIN_DATO_REVISAR_YA` ⇒ "Revisar" [40-69]; `POR_VENCER` ⇒ "Pronto" [70-89]; resto ⇒ "Al día" [90-100]. El resultado es `bruto` acotado a la banda.

Un vehículo con una pieza de seguridad vencida nunca sale verde, y con una pieza en `SIN_DATO_REVISAR_YA` queda como mucho en "Revisar".

## 4. Documentos

| Documento | Vencimiento | Notas |
|---|---|---|
| SOAT | fecha de expedición + 1 año | |
| RTM | fecha de la última revisión + 1 año | Si "aún no aplica": primera RTM a los 5 años de la matrícula para carros particulares y a los 2 años para motos (Decreto 019 de 2012, art. 202). Confirmar la norma vigente antes de mostrarla como dato legal |
| Seguro todo riesgo | fecha de inicio + 1 año (editable) | Opcional |
| Extintor | fecha de recarga + 1 año | Vencido ⇒ cuenta como faltante en el kit de carretera (RF-DOC-05) |
| Kit de carretera | sin fecha | Lista de los 9 elementos del art. 30 de la Ley 769 de 2002; un faltante avisa una vez |
| Impuesto vehicular | la fecha límite que escribe la persona | La app no la calcula: cada departamento fija la suya (RF-DOC-06) |
| Licencia de conducción | la fecha de vencimiento que escribe la persona | **Por cuenta**, no por vehículo; solo se guarda la fecha (RF-DOC-07) |
| Multas | la fecha límite de pago con descuento que anota la persona | Recordatorio mensual con enlace a la consulta pública del SIMIT; WEVEH no consulta SIMIT (RF-DOC-08) |

Estado: `VIGENTE` (> 30 días), `POR_VENCER` (≤ 30 días), `VENCIDO` (< 0). Avisos locales (RF-DOC-04, ADR 0020): **insistencia alta** (SOAT, RTM, licencia) a los 30, 7, 3 y 1 día y el día, y diario si venció; **insistencia media** (seguro, extintor, impuesto) a los 30 y 7 días y el día, y semanal si venció. Se agrupan en una notificación y entre mantenimiento y documentos hay máximo dos por día (RNF-37).

## 5. Kilometraje

- `Kilometraje` es value object: 0 ≤ km ≤ 2.000.000.
- Nunca decrece: si el nuevo valor es menor, error `KilometrajeDecreciente` (409).
- Salto anómalo: más de `max(3 × kmPromedioDia × diasDesdeUltimo, 1.500)` km ⇒ la app pide confirmación antes de guardar.
- **El kilometraje es siempre el confirmado por la persona** (ADR 0020): nunca se estima el de hoy. El km promedio al mes solo sirve para detectar saltos raros.
- Cada actualización queda en `RegistroKilometraje` (fecha, km, origen: manual, servicio, tanqueada; foto del tablero opcional como evidencia, que ningún modelo lee). Un recordatorio local lo pide cada 15 días (7, 15 o 30 configurable, RF-GAR-07).

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
