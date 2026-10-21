# ADR 0019 — Conocimiento por intención y búsqueda iterativa gobernada por código

- **Estado:** aceptada (2026-10-21; extiende el [ADR 0013](0013-busqueda-web-perfilador.md))
- **Fecha:** 2026-10-19
- **Autores:** Isaac Cano, Pablo Rodríguez

## Contexto

El ADR 0013 define una sola investigación por modelo de vehículo: 3 o 4 búsquedas por plantilla, un checklist de puntos por dominio y un modelo que solo lee y estructura. La persona pidió más: que el agente investigue de forma autónoma, itere el contexto a medida que conoce el vehículo (por ejemplo, si le cambiaron el motor a diésel) y que haya fuentes de conocimiento dinámicas con enfoques distintos según la necesidad. El ADR 0013 descartó que el modelo pida las búsquedas por su cuenta, porque los modelos gratuitos pequeños a veces inventan la llamada.

## Decisión

- El conocimiento se organiza por **intención**: plan de mantenimiento y consumo, fallas conocidas, campañas de seguridad, particularidades por combustible o tracción, y datos de un cambio de motor o conversión.
- Cada intención tiene su **plantilla de búsqueda** y su **checklist de dominios** (por ejemplo, `sic.gov.co` y la página del fabricante pesan más para campañas). Se guarda cada resultado con URL y `verificada = false`.
- **La iteración la gobierna el código:** el modelo puede pedir una nueva intención de una **lista cerrada** (salida estructurada validada), y el backend la ejecuta dentro del **presupuesto de búsquedas por sesión**. El modelo nunca llama herramientas libremente, así se conserva lo bueno del ADR 0013 y se gana la iteración.
- **El catálogo del Ministerio va primero** para los atributos que ya publica (RF-CAT-04), y su enriquecimiento con fuente vive en `catalogo.atributo_linea` ([ADR 0021](0021-enriquecimiento-catalogo-por-familia.md)). Los datos legales (vigencia de la licencia, primera RTM) salen de una **tabla curada por el equipo** con norma y fecha de verificación, no de una búsqueda libre.
- Las fichas se reutilizan por modelo 180 días; las campañas y las fallas conocidas se guardan separadas, con el tipo de fuente (fabricante, SIC, concesionario, foro).

## Alternativas consideradas

- **Agente que llama herramientas de búsqueda sin límite:** más flexible, pero impredecible y caro con modelos gratuitos.
- **Una sola búsqueda por modelo (ADR 0013 tal cual):** barata, pero no incorpora lo que la persona cuenta.
- **Base de conocimiento estática armada a mano:** confiable pero no escala a 11.583 líneas.

## Consecuencias

- Se agrega el concepto `Intencion` y la tabla de plantillas y dominios, ambas editables sin desplegar.
- El cupo de Brave pasa a ser una restricción: su plan gratuito cambió (el precio y el cupo actuales se verificaron solo en una fuente secundaria que se contradice); confirmar con Brave antes de la fase 4. RNF-36 vigila el cupo.
- RF-PER-01 y RF-PER-10 recogen este comportamiento.
