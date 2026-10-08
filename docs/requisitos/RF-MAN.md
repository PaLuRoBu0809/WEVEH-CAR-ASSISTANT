# RF-MAN — Plan de mantenimiento, salud e historial

Fórmulas: skill `weveh-dev:dominio-vehiculo` (§2 y §3). Vectores: `contracts/vectores-estado-pieza.json` y `contracts/vectores-salud.json`. Fase 2.

## RF-MAN-01 Plan genérico al registrar
Como dueño quiero ver qué mantenimiento necesita mi vehículo desde el primer día.
- Dado que registré un carro
  Cuando veo su plan
  Entonces aparecen aceite y filtro, filtro de aire, filtro de combustible, líquido de frenos, pastillas, refrigerante, bujías, correa o cadena de distribución, batería y llantas, marcados "Recomendación general"
- Dado que registré una moto
  Cuando veo su plan
  Entonces además aparece la cadena de transmisión

## RF-MAN-02 Estado de cada pieza
Como dueño quiero saber qué tan cerca está cada pieza de su próximo servicio.
- Dado aceite con intervalo de 5.000 km (sin intervalo en meses), último cambio a los 188.000 km y el carro en 190.000 km
  Cuando veo el plan
  Entonces la pieza está "Al día" y dice "Faltan 3.000 km"
- Dado una pieza con consumo entre 85 % y 100 %
  Cuando veo el plan
  Entonces dice "Ya casi toca"
- Dado una pieza con consumo de 100 % o más
  Cuando veo el plan
  Entonces dice "Se pasó por N km" o "Se pasó por N meses"
- Dado una pieza sin último servicio conocido
  Cuando veo el plan
  Entonces dice "No sabemos cuándo se hizo"

El consumo es el mayor entre consumo por km y consumo por tiempo.

## RF-MAN-03 Salud del vehículo
Como dueño quiero un número y un color que me digan cómo está mi vehículo.
- Dado que todas las piezas están al día y los documentos vigentes
  Cuando veo el inicio
  Entonces la salud está entre 90 y 100, banda "Al día"
- Dado que una pieza de seguridad (frenos, llantas, dirección, distribución) está vencida
  Cuando veo el inicio
  Entonces la salud queda entre 0 y 39, banda "Atención", aunque el resto esté bien
- Dado que la Prado del ejemplo tiene la distribución sin dato a 190.000 km
  Cuando veo el inicio
  Entonces "Lo más urgente" muestra primero lo vencido y luego lo que está por vencer o sin dato de seguridad

## RF-MAN-04 Registrar un servicio
Como dueño quiero anotar lo que le hicieron al vehículo.
- Dado que registro "Cambio de aceite" a los 190.500 km con fecha de hoy y la pieza aceite
  Cuando guardo
  Entonces aparece en el historial y la pieza aceite vuelve a "Al día"
- Dado que el km del servicio es mayor al kilometraje actual
  Cuando guardo
  Entonces el kilometraje del vehículo se actualiza a ese valor

## RF-MAN-05 Ver historial
Como dueño quiero ver los servicios y fallas pasadas ordenadas del más reciente al más antiguo.
- Dado que tengo tres servicios registrados
  Cuando abro el historial
  Entonces los veo con fecha, km, descripción, taller y valor si los anoté

## RF-MAN-06 Editar un intervalo
Como dueño quiero ajustar el intervalo de una pieza si mi mecánico me dio otro.
- Dado que cambio el intervalo del aceite a 10.000 km
  Cuando guardo
  Entonces la pieza queda con origen "Usuario" y su estado se recalcula
