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
  Entonces veo "PRADO VX 5P AT · 3.400 cc" con combustible, transmisión y tracción sugeridos
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
