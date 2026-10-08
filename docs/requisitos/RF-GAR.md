# RF-GAR — Garaje y registro del vehículo

Detalle de reglas: skill `weveh-dev:dominio-vehiculo` (§1 y §5). Fases 0 y 1. Ejemplo de referencia: Toyota Prado J95 VX 2008, 3.4 V6, 190.000 km.

## RF-GAR-00 Identidad por dispositivo
Como dueño quiero usar la app sin crear una cuenta.
- Dado que abro la app por primera vez
  Cuando arranca
  Entonces se genera un identificador del dispositivo y se guarda de forma segura
- Dado que una petición a la API no trae `X-Weveh-Dispositivo` o no es un UUID v4
  Cuando llega al backend
  Entonces responde 400 con Problem Details
- Dado que pido un vehículo que pertenece a otro dispositivo
  Cuando consulto
  Entonces recibo 404

## RF-GAR-01 Ver mi garaje
Como dueño quiero ver mis vehículos al abrir la app.
- Dado que no he registrado vehículos
  Cuando abro el garaje
  Entonces veo "Tu garaje está vacío" y un botón para registrar uno
- Dado que ya registré vehículos y no tengo red
  Cuando abro el garaje
  Entonces veo los vehículos guardados en el celular

## RF-GAR-02 Registrar vehículo (registro básico)
Como dueño quiero registrar mi carro en menos de 2 minutos para que WEVEH conozca su estado.
- Dado que elijo Carro → TOYOTA → "PRADO VX 5P AT · 3.400 cc" → 2008, escribo 190.000 km, aceite a los 188.000 km el 2026-06-05, SOAT 2026-06-30 y RTM 2026-06-28
  Cuando guardo
  Entonces veo el vehículo en mi garaje con su salud calculada
- Dado que no sé cuándo fue el último cambio de aceite y marco "No sé"
  Cuando guardo
  Entonces el vehículo se crea y la pieza de aceite queda "No sabemos cuándo se hizo"
- Dado que mi vehículo no aparece en el catálogo
  Cuando escribo marca y línea a mano
  Entonces se guarda sin línea de catálogo y veo "Lo revisaremos"
- Dado que escribo un kilometraje negativo
  Cuando guardo
  Entonces veo "El kilometraje debe ser mayor o igual a cero"
- Dado que estoy en el registro
  Cuando avanzo por los pasos
  Entonces en ningún momento se me pide el nivel de combustible

Campos obligatorios: tipo, marca y línea (catálogo o texto libre), año modelo, kilometraje actual, último cambio de aceite (o "No sé"), fecha del SOAT y fecha de la última RTM (o "aún no aplica"). Opcionales: uso (por defecto mixto), km promedio al mes (por defecto 1.000), seguro todo riesgo, fecha de matrícula, alias y placa.

## RF-GAR-03 Editar vehículo
Como dueño quiero corregir los datos de mi vehículo.
- Dado que cambio el alias a "La Prado"
  Cuando guardo
  Entonces veo el nuevo alias en el garaje y en el inicio
- Dado que otra copia de la app editó el mismo vehículo antes
  Cuando guardo
  Entonces recibo 409 y la app me muestra los datos actuales

## RF-GAR-04 Eliminar vehículo
Como dueño quiero eliminar un vehículo que ya no tengo.
- Dado que confirmo "Eliminar La Prado"
  Cuando elimino
  Entonces desaparece del garaje junto con su plan, historial, documentos, tanqueadas y consultas

## RF-GAR-05 Actualizar kilometraje
Como dueño quiero anotar el kilometraje actual para que el plan se recalcule.
- Dado que mi vehículo tiene 190.000 km y escribo 191.200
  Cuando guardo
  Entonces el kilometraje queda en 191.200 y el plan se recalcula
- Dado que escribo 185.000
  Cuando guardo
  Entonces veo que el kilometraje no puede bajar (409)
- Dado que escribo un salto mayor a max(3 × km promedio diario × días desde la última lectura, 1.500)
  Cuando guardo
  Entonces la app me pide confirmar antes de guardarlo
