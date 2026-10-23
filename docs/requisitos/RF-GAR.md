# RF-GAR — Garaje y registro del vehículo

Detalle de reglas: skill `weveh-dev:dominio-vehiculo` (§1 y §5). Ejemplo de referencia: Toyota Prado J95 VX 2008, 3.4 V6, 190.000 km.

> RF-GAR-00 (identidad por dispositivo) quedó reemplazado por [RF-CTA](RF-CTA.md) (ADR 0005). Todo lo de este archivo es **de la cuenta** de la persona: un vehículo de otra cuenta responde 404.
>
> Actualizado el 2026-10-21: el kilometraje es siempre el que la persona confirma, nunca una estimación (RF-GAR-05, RF-GAR-07), y el registro no pregunta lo que el catálogo ya sabe (RF-CAT-04).

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
- Dado que el catálogo ya conoce el combustible, la transmisión y la tracción de mi línea
  Cuando avanzo en el registro
  Entonces no se me pregunta ninguno de los tres (RF-CAT-04)

**Obligatorios:** tipo, marca y línea (catálogo o texto libre), año modelo y kilometraje actual. **Opcionales en el registro** (se completan después, con las tarjetas de Inicio, la entrevista del agente o un recordatorio): último cambio de aceite, SOAT, RTM, seguro todo riesgo, fecha de matrícula, alias y placa. El uso, el entorno (RF-PER-07) y el km por mes no se preguntan en el registro, porque RNF-11 mide menos de un minuto: el uso queda en "Mixto" y el km por mes en 1.000 hasta que la persona los cambie (el km por mes solo sirve para detectar saltos raros, RF-GAR-05).

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
- Dado que cambio el combustible, la transmisión o la tracción de mi vehículo (por ejemplo, tras cambiarle el motor)
  Cuando guardo
  Entonces el plan se reconstruye con ese perfil y las piezas afectadas quedan en "Sin dato" hasta que yo informe lo que se hizo (RF-MAN-07)

Se puede editar: alias, placa, uso, entorno, km por mes, fecha de matrícula, combustible, transmisión y tracción. El kilometraje va por RF-GAR-05.

## RF-GAR-04 Eliminar vehículo
Como dueño quiero eliminar un vehículo que ya no tengo.
- Dado que confirmo "Eliminar La Prado"
  Cuando elimino
  Entonces desaparece del garaje junto con su plan, historial, fotos, documentos, tanqueadas y conversaciones

## RF-GAR-05 Actualizar kilometraje
Como dueño quiero anotar el kilometraje real para que el plan y los avisos sean confiables.
- Dado que mi vehículo tiene 190.000 km y escribo 191.200
  Cuando guardo
  Entonces el kilometraje queda en 191.200 y el plan se recalcula
- Dado que escribo 185.000
  Cuando guardo
  Entonces veo que el kilometraje no puede bajar
- Dado que me equivoqué en la última lectura y la anoté hace 7 días o menos
  Cuando toco "¿Te equivocaste? Corregir esta lectura" y escribo el número correcto, menor
  Entonces queda corregida, sin bajar de la lectura anterior (ADR 0023); pasados 7 días la lectura queda fija
- Dado que escribo un salto mayor a max(3 × km promedio diario × días desde la última lectura, 1.500)
  Cuando guardo
  Entonces la app me pide confirmar antes de guardarlo
- Dado que la última lectura confirmada tiene más de 30 días
  Cuando abro Inicio o el plan
  Entonces veo "Kilometraje confirmado hace X días" con el botón "Actualizar", y los estados se calculan con ese kilometraje, sin sumarle ningún estimado
- Dado que actualizo el kilometraje y adjunto una foto del tablero
  Cuando guardo
  Entonces la foto queda como evidencia de esa lectura y el valor es el que yo escribí; ningún modelo lee la foto (ADR 0018)

El km promedio al mes no se usa para estimar el kilometraje de hoy; solo para detectar saltos raros. El plan nunca muestra fechas estimadas por kilómetros: muestra los kilómetros que faltan.

## RF-GAR-06 Cambios sin red
Como dueño quiero anotar cosas aunque no tenga señal.
- Dado que no tengo red y actualizo el kilometraje
  Cuando vuelve la conexión
  Entonces el cambio se envía solo y una sola vez
- Dado que anoto el kilometraje sin red
  Cuando lo guardo
  Entonces lo veo de una vez con el aviso "Quedó anotado en tu celular. Lo enviamos solo cuando vuelva la señal",
  aunque cierre la app antes de que vuelva la red
- Dado que el cambio guardado sin red es más viejo o menor que una lectura que ya llegó desde otro lado
  Cuando se sincroniza
  Entonces se descarta sin error: gana la lectura más reciente (ADR 0009) y el kilometraje nunca baja
- Dado que el cambio guardado sin red es un salto raro
  Cuando se sincroniza
  Entonces la app me pide confirmarlo, como con red (RF-GAR-05)
- Dado que no tengo red y quiero editar o registrar un vehículo
  Cuando lo intento
  Entonces veo que necesito conexión: solo el kilometraje se anota sin red

## RF-GAR-07 Recordatorio de kilometraje
Como dueño quiero que la app me pida el kilometraje cada cierto tiempo, para no depender de acordarme.
- Dado que no actualicé el kilometraje en 15 días (se puede cambiar a 7, 15 o 30 en Perfil)
  Cuando llega ese día
  Entonces recibo una notificación local "¿Cuántos km marca hoy La Prado?" que abre la pantalla para escribirlo
- Dado que actualicé el kilometraje, registré un servicio o una tanqueada con kilometraje
  Cuando se guarda
  Entonces el plazo del recordatorio vuelve a empezar
- Dado que tengo las notificaciones desactivadas
  Cuando abro Inicio
  Entonces veo el aviso fijo de RF-DOC-04 para activarlas
