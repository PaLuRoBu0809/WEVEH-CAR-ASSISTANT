# RF-CAT — Catálogo de vehículos de Colombia

Fuente: tablas de base gravable del Ministerio de Transporte, año fiscal 2025 (tablas 1, 2, 3, 5 y 9). Detalle: skill `weveh-dev:catalogo-vehiculos`. Fase 1.

## RF-CAT-01 Buscar marcas
Como dueño quiero buscar la marca de mi vehículo para no escribirla a mano.
- Dado que elegí el tipo "Carro" y escribo "toy"
  Cuando busco
  Entonces veo "TOYOTA" entre los resultados, incluidas las marcas de tipo AMBOS
- Dado que escribo "citroen" sin tilde ni mayúsculas
  Cuando busco
  Entonces encuentro "CITROËN" si existe en el catálogo
- Dado que no hay red
  Cuando abro el selector de marca
  Entonces veo las marcas que ya había buscado, guardadas en el celular (ADR 0009)

## RF-CAT-02 Buscar líneas de una marca
Como dueño quiero encontrar la línea exacta de mi vehículo escribiendo partes del nombre.
- Dado que elegí TOYOTA y escribo "prado vx"
  Cuando busco
  Entonces veo "PRADO VX 5P AT · 3.400 cc" con los atributos que el catálogo ya conoce (RF-CAT-04)
- Dado que hay más de 50 coincidencias
  Cuando busco
  Entonces veo como máximo 50, ordenadas por nombre y cilindrada
- Dado que una línea es genérica ("SIN LINEA", "LINEAS Y CILINDRAJES NO INCLUIDOS...")
  Cuando busco
  Entonces no aparece en los resultados

## RF-CAT-03 Importar y actualizar el catálogo
Como equipo queremos cargar las tablas del Ministerio cada año con un proceso repetible que no rompa los vehículos registrados (ADR 0014).
- Dado los Excel de las tablas 1, 2, 3, 5 y 9 de 2025
  Cuando corro el script de importación y los `\copy`
  Entonces quedan 508 marcas y 11.583 líneas (283 genéricas) en el esquema `catalogo`
- Dado que el script detecta marcas parecidas (por ejemplo "accura / acura")
  Cuando termina
  Entonces las reporta en `resumen.json` y no las fusiona solas
- Dado las tablas de un año fiscal nuevo
  Cuando corro la importación
  Entonces se agregan las líneas nuevas y se actualizan las existentes, sin borrar ninguna, y queda un reporte
- Dado un año fiscal ya cargado
  Cuando corro la importación otra vez
  Entonces no se duplica nada

## RF-CAT-04 No preguntar lo que el catálogo ya sabe
Como dueño quiero que la app no me pregunte datos que ya se conocen de mi línea (si es 4x4, automática, diésel, híbrida o eléctrica).
- Dado que elijo "4RUNNER 4X4 4.0 V6 AT" y el nombre de la línea dice la tracción y la transmisión
  Cuando avanzo en el registro
  Entonces no se me preguntan; los veo como datos de WEVEH con la opción "Corregir"
- Dado que el dato no está en el nombre pero WEVEH lo investigó para mi modelo y cilindraje con una fuente revisada (ADR 0021)
  Cuando avanzo en el registro
  Entonces no se me pregunta; veo "Dato de WEVEH · según [fuente]" con la opción "Corregir"
- Dado que mi modelo se vende en varias versiones (por ejemplo, 4x2 y 4x4)
  Cuando avanzo en el registro
  Entonces se me pregunta solo entre esas opciones, con "No sé"
- Dado que no hay ningún dato de mi línea
  Cuando avanzo en el registro
  Entonces se me pregunta una sola vez entre gasolina, diésel, gas, híbrido, híbrido enchufable y eléctrico, con "No sé", sin ninguna opción marcada de antemano
- Dado que respondo "No sé"
  Cuando veo mi plan
  Entonces se usa la base de gasolina marcada "Recomendación general" y el agente lo averigua después (RF-PER-01)
- Dado que corrijo un dato sugerido (por ejemplo, el vehículo tiene el motor cambiado)
  Cuando guardo
  Entonces el cambio se aplica a mi vehículo y el plan se reconstruye (RF-MAN-07)

Las tablas del Ministerio no tienen columnas de combustible, transmisión ni tracción: se deducen del nombre de la línea y de su clase (capa 0) y, cuando el nombre no lo dice, se investigan por familia en la web con fuente (capa 1, ADR 0021). Un dato sin origen **nunca** se rellena en silencio. Las restricciones de `catalogo.linea.combustible` y `vehiculo.combustible` (y el enum `Combustible`) deben aceptar gasolina, gas e híbrido enchufable.

## RF-CAT-05 Mejorar la fuente de conocimiento
Como equipo queremos que el catálogo sepa cada vez más de cada línea para preguntar menos.
- Dado el reporte de cada importación
  Cuando termina
  Entonces informa, por tabla y por origen, qué porcentaje de líneas tiene resuelto cada atributo (combustible, transmisión, tracción, cilindrada) y lista las que quedaron sin resolver
- Dado un lote de atributos investigados en la web (ADR 0021)
  Cuando se valida
  Entonces cada dato tiene su URL, una cita y su tipo de fuente; se acepta con una fuente del fabricante o del concesionario, o con dos independientes que coincidan; y el equipo revisa una muestra del 10 % antes de cargarlo
- Dado una línea con atributos sin resolver
  Cuando el agente investiga el modelo (RF-PER-01)
  Entonces propone el valor con su fuente, como propuesta que no cambia el catálogo hasta que se revise
- Dado que varias personas corrigen el mismo atributo de la misma línea
  Cuando se genera el reporte
  Entonces esa línea aparece como "por revisar" con las correcciones (sin datos de las personas)

Línea base medida el 2026-10-21 sobre las líneas reales de carro: combustible 3,6 %, transmisión 51,1 %, tracción 11,8 %; en motos 3,6 %, 39,4 % y 3,0 %.

## RF-CAT-04 No preguntar lo que el catálogo ya sabe
Como dueño quiero que la app no me pregunte datos que ya vienen en el nombre de mi línea (si es 4x4, automática, diésel, híbrida o eléctrica).
- Dado que elijo "4RUNNER 4X4 4.0 V6 AT" y el catálogo trae combustible, transmisión y tracción
  Cuando avanzo en el registro
  Entonces no se me preguntan; los veo como datos de WEVEH con la opción "Corregir"
- Dado que elijo una línea cuyo nombre no indica la tracción y esa línea tiene varias versiones
  Cuando avanzo en el registro
  Entonces se me pregunta solo ese dato, con opciones cerradas y "No sé"
- Dado que el catálogo no trae el combustible de la línea
  Cuando avanzo en el registro
  Entonces se me pregunta una sola vez entre gasolina, diésel, gas, híbrido, híbrido enchufable y eléctrico, con "No sé"
- Dado que respondo "No sé"
  Cuando veo mi plan
  Entonces se usa la base de gasolina marcada "Recomendación general" y el agente lo averigua después (RF-PER-01)
- Dado que corrijo un dato sugerido (por ejemplo, el vehículo tiene el motor cambiado)
  Cuando guardo
  Entonces el cambio se aplica a mi vehículo y el plan se reconstruye (RF-MAN-07)

Hoy el combustible se infiere solo para diésel, híbrido y eléctrico; en lo demás queda nulo, que significa **sin dato**: la app no lo convierte en gasolina por su cuenta, pregunta. Las restricciones de `catalogo.linea.combustible` y de `vehiculo.combustible` (y el enum `Combustible`) deben aceptar gasolina, gas e híbrido enchufable. Solo se infiere gasolina o gas cuando el nombre de la línea da evidencia (por ejemplo, "GNV").

## RF-CAT-05 Mejorar la fuente de conocimiento
Como equipo queremos que el catálogo sepa cada vez más de cada línea para preguntar menos.
- Dado el reporte de cada importación
  Cuando termina
  Entonces informa qué porcentaje de líneas tiene resuelto cada atributo (combustible, transmisión, tracción, cilindrada) y lista las que quedaron sin resolver
- Dado una línea con atributos sin resolver
  Cuando el agente investiga el modelo (RF-PER-01)
  Entonces propone el valor con su fuente, como propuesta que no cambia el catálogo hasta que se revise con un script
- Dado que varias personas corrigen el mismo atributo de la misma línea
  Cuando se genera el reporte
  Entonces esa línea aparece como "por revisar" con las correcciones (sin datos de las personas)
