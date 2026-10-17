# RF-GAR — Garaje y registro del vehículo

Detalle de reglas: skill `weveh-dev:dominio-vehiculo` (§1 y §5). Ejemplo de referencia: Toyota Prado J95 VX 2008, 3.4 V6, 190.000 km.

> RF-GAR-00 (identidad por dispositivo) quedó reemplazado por [RF-CTA](RF-CTA.md) (ADR 0005). Todo lo de este archivo es **de la cuenta** de la persona: un vehículo de otra cuenta responde 404.

## RF-GAR-01 Ver mi garaje
Como dueño quiero ver mis vehículos al abrir la app, aunque no tenga internet.
- Dado que no he registrado vehículos
  Cuando abro el garaje
  Entonces veo "Tu garaje está vacío" y un botón para registrar uno
- Dado que ya registré vehículos y no tengo red
  Cuando abro el garaje
  Entonces veo el último estado guardado en el celular y el aviso "Sin conexión · actualizado hace X" (ADR 0009)

## RF-GAR-02 Registrar vehículo (datos mínimos)
Como dueño quiero agregar mi carro o moto en menos de un minuto.
- Dado que elijo Carro → TOYOTA → "PRADO VX 5P AT · 3.400 cc" → 2008 y escribo 190.000 km
  Cuando guardo
  Entonces veo el vehículo en mi garaje
- Dado que mi vehículo no aparece en el catálogo
  Cuando escribo marca y línea a mano
  Entonces se guarda sin línea de catálogo y veo "Lo revisaremos"
- Dado que escribo un kilometraje negativo
  Cuando guardo
  Entonces veo "El kilometraje debe ser mayor o igual a cero"
- Dado que estoy en el registro
  Cuando avanzo
  Entonces en ningún momento se me pide el nivel de combustible

**Obligatorios:** tipo, marca y línea (catálogo o texto libre), año modelo y kilometraje actual. **Opcionales en el registro** (se completan después, en la entrevista del agente o desde un recordatorio en Inicio): último cambio de aceite, SOAT, RTM, seguro todo riesgo, fecha de matrícula, uso, km por mes, alias y placa.

## RF-GAR-02b Completar lo que falta
Como dueño quiero que la app me recuerde los datos que faltan para cuidar bien mi vehículo.
- Dado que registré la Prado sin SOAT ni RTM
  Cuando abro Inicio
  Entonces veo "Te faltan los papeles de La Prado" con un botón para agregarlos
- Dado que no sé cuándo fue el último cambio de aceite
  Cuando lo indico
  Entonces la app me dice si conviene revisarlo ya según el kilometraje, me explica paso a paso cómo revisar el nivel y el color del aceite, y me ofrece "Ya lo cambié" para anotarlo

## RF-GAR-03 Editar vehículo
Como dueño quiero corregir los datos de mi vehículo.
- Dado que cambio el alias a "La Prado"
  Cuando guardo
  Entonces veo el nuevo alias en el garaje y en Inicio
- Dado que otra sesión editó el mismo vehículo después de que yo lo abrí
  Cuando guardo
  Entonces queda el cambio más reciente, siempre que cumpla las reglas, y la app me muestra cómo quedó (ADR 0009)

Se puede editar: alias, placa, uso, km por mes y fecha de matrícula. El kilometraje va por RF-GAR-05.

## RF-GAR-04 Eliminar vehículo
Como dueño quiero eliminar un vehículo que ya no tengo.
- Dado que confirmo "Eliminar La Prado"
  Cuando elimino
  Entonces desaparece del garaje junto con su plan, historial, documentos, tanqueadas y conversaciones

## RF-GAR-05 Actualizar kilometraje
Como dueño quiero anotar el kilometraje actual para que el plan se recalcule.
- Dado que mi vehículo tiene 190.000 km y escribo 191.200
  Cuando guardo
  Entonces el kilometraje queda en 191.200 y el plan se recalcula
- Dado que escribo 185.000
  Cuando guardo
  Entonces veo que el kilometraje no puede bajar
- Dado que escribo un salto mayor a max(3 × km promedio diario × días desde la última lectura, 1.500)
  Cuando guardo
  Entonces la app me pide confirmar antes de guardarlo

## RF-GAR-06 Cambios sin red
Como dueño quiero anotar cosas aunque no tenga señal.
- Dado que no tengo red y actualizo el kilometraje
  Cuando vuelve la conexión
  Entonces el cambio se envía solo y una sola vez
- Dado que el cambio guardado sin red rompe una regla (por ejemplo, baja el kilometraje)
  Cuando se sincroniza
  Entonces se rechaza y la app me avisa qué no se guardó
