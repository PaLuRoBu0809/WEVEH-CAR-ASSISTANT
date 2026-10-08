# RF-COM — Tanqueadas y consumo de combustible

Reglas: skill `weveh-dev:dominio-vehiculo` (§6). Vectores: `contracts/vectores-consumo.json`. Fase 5.

## RF-COM-01 Registrar tanqueada
Como dueño quiero anotar cada vez que tanqueo.
- Dado que escribo fecha, km, galones, valor (opcional) y marco "Tanque lleno"
  Cuando guardo
  Entonces aparece en mis tanqueadas y el kilometraje del vehículo se actualiza si es mayor

## RF-COM-02 Primer tanque lleno
Como dueño quiero entender por qué todavía no veo mi consumo.
- Dado que es mi primera tanqueada con tanque lleno
  Cuando guardo
  Entonces veo "Con tu próximo tanque lleno te mostramos el consumo"

## RF-COM-03 Calcular consumo
Como dueño quiero saber cuántos km por galón rinde mi vehículo.
- Dado un lleno a los 190.000 km, una tanqueada parcial de 4 galones y otro lleno a los 190.260 km con 6 galones
  Cuando guardo el segundo lleno
  Entonces el consumo es 26 km/gal (260 km / 10 galones)
- Dado que anoté el valor en pesos
  Cuando veo el consumo
  Entonces también veo el costo por km

## RF-COM-04 ¿Es normal mi consumo?
Como dueño quiero saber si mi vehículo está gastando de más.
- Dado un consumo ≥ 90 % de la referencia del modelo para mi uso
  Cuando lo veo
  Entonces dice "Normal"
- Dado un consumo entre 75 % y 90 %
  Cuando lo veo
  Entonces dice "Un poco alto" y sugiere revisar presión de llantas, filtro de aire y estilo de manejo
- Dado un consumo menor al 75 %
  Cuando lo veo
  Entonces dice "Consumo alto" y me ofrece preguntarle al Mecánico IA
- Dado que no hay referencia del modelo
  Cuando lo veo
  Entonces se compara con el promedio de mis últimas 3 mediciones
