# Requisitos funcionales del MVP

Formato ISO/IEC/IEEE 29148: historia de usuario y criterios de aceptación en Gherkin (Dado / Cuando / Entonces). Cada PR enlaza los IDs que cubre y cada criterio se cubre con al menos una prueba.

**Estados:** ✅ Hecho (criterios cubiertos por pruebas) · 🟡 Parcial (qué falta en la nota) · ⬜ Pendiente · 🔁 Hecho pero cambia por una decisión nueva

Estado revisado el 2026-10-10. Ampliación propuesta el 2026-10-19 y aprobada el 2026-10-21: ver "Decisiones confirmadas" y "Decisiones por confirmar".

| ID | Requisito | Fase | Estado | Nota |
|---|---|---|---|---|
| ~~RF-GAR-00~~ | ~~Identidad por dispositivo~~ | 0 | 🔁 | Reemplazado por RF-CTA (ADR 0005) |
| RF-CTA-01..07 | [Cuentas](RF-CTA.md) | 1 | ✅ | Correo y contraseña, Google, recuperar, confirmar, Mis datos (nombre, correo, contraseña) y confirmar la identidad. El enlace mágico salió del MVP |
| RF-DAT-01..08 | [Tratamiento de datos](RF-DAT.md) | 1 | 🟡 | 01, 02 y 04 a 07 hechos (política, autorización con medio, Mis datos, corregir, eliminar = revocar). 03 se activa cuando cambie la política. 08: nada personal llega al modelo; falta el aviso en Preguntar (va con el Mecánico IA) |
| RF-DAT-09..10 | Audio, fotos, terceros y ubicación gruesa | 2 | ⬜ | Reglas de privacidad para los medios y la entrevista |
| RF-GAR-01 | Ver mi garaje | 0 / 1 | ✅ | Sin red se ve lo último guardado con "Sin conexión · actualizado hace X" (ADR 0009) |
| RF-GAR-02 | Registrar vehículo (datos mínimos) | 1 | 🔁 | Hecho; cambia: no pregunta lo que el catálogo ya sabe (RF-CAT-04) y el uso sale del registro (queda "Mixto") |
| RF-GAR-02b | Completar lo que falta | 1 / 2 | ✅ | Aviso en Inicio, completar datos y guía del aceite |
| RF-GAR-03 | Editar vehículo | 1 | 🟡 | Pantalla hecha; "gana lo último" llega con sin red (ADR 0009), hoy responde 409. Nuevo: editar combustible, transmisión y tracción |
| RF-GAR-04 | Eliminar vehículo | 1 | ✅ | Plan, documentos, fotos y tanqueadas se borrarán en cascada cuando existan |
| RF-GAR-05 | Actualizar kilometraje | 1 | 🔁 | Hecho; cambia: "confirmado hace X días", sin estimaciones y foto del tablero como evidencia |
| RF-GAR-06 | Cambios sin red | 1 | ✅ | Solo el kilometraje; se envía solo y una vez (`Idempotency-Key`) y gana lo último |
| RF-GAR-07 | Recordatorio de kilometraje | 2 | ⬜ | Notificación local cada 15 días (configurable, D-05) |
| RF-CAT-01 | Buscar marcas | 1 | ✅ | Sin red se ven las marcas y líneas ya buscadas |
| RF-CAT-02 | Buscar líneas de una marca | 1 | 🔁 | Hecho; cambia: muestra los atributos que el catálogo ya conoce y su origen |
| RF-CAT-03 | Importar y actualizar el catálogo | 1 | 🟡 | 2025 cargado con script; falta el proceso por año fiscal (ADR 0014) |
| RF-CAT-04 | No preguntar lo que el catálogo ya sabe | 1 | ⬜ | Tres orígenes: nombre de la línea, investigación por familia con fuente (ADR 0021) o pregunta con "No sé"; nada se rellena en silencio |
| RF-CAT-05 | Mejorar la fuente de conocimiento | 1 / 2 | ⬜ | Reporte de cobertura por origen (línea base en carros: 3,6 / 51,1 / 11,8 %) y lotes revisados (ADR 0021) |
| RF-MIA-01 | Preguntar por un síntoma | 1 | 🔁 | Funciona; cambia a estructura de 3 pasos, sin precios y con plazo (RF-MIA-08) |
| RF-MIA-01b | ¿Cuánto podría costar? | 1 | ⬜ | |
| RF-MIA-01c | Ficha de falla automática | 2 | ⬜ | Necesita plan e historial; ampliada: ficha automática, cierre y compartir |
| RF-MIA-02 | Conversación con memoria | 1 | ⬜ | Hoy es una pregunta y una respuesta |
| RF-MIA-03 | Regla de seguridad | 1 | 🔁 | Hecho; cambia: se activa con un síntoma, no con la sola mención de la pieza |
| RF-MIA-04 | Respuestas seguras ante fallas | 1 | 🟡 | Falta el cortacircuitos ("mucha demanda" al instante) |
| RF-MIA-05 | Datos que faltan | 1 | ⬜ | Ampliada: lleva a las tarjetas |
| RF-MIA-06 | Trazabilidad | 1 | ✅ | Incluye el modelo que respondió |
| RF-MIA-07 | Límites de uso que no estorban | 1 | 🔁 | Hoy: 30 por vehículo al día; cambia a balde por cuenta |
| RF-MIA-08 | Plazo y recomendación estrictos de la app | 2 | ⬜ | Cambia el esquema del diagnóstico: obliga a correr evals; antes, acotar el validador (RF-MIA-03) |
| RF-MIA-09 | Lo que dijo mi mecánico (botón informativo) | 2 | ⬜ | Antes estaba fuera del MVP como retroalimentación del modelo |
| RF-MIA-10 | El agente conoce mi vehículo | 2 | ⬜ | Contexto completo, sin datos personales |
| RF-MIA-11 | Preguntar o contar un servicio por voz | 2 | ⬜ | Whisper de Groq solo para transcribir (ADR 0018) |
| RF-MAN-01..06 | [Mantenimiento](RF-MAN.md) | 2 | ⬜ | Vectores listos en `contracts/`; 01, 02, 03, 04 y 05 ampliados |
| RF-MAN-04b | Contarle el servicio al agente | 2 | ⬜ | Extracción con modelo gratuito y confirmación |
| RF-MAN-04c | Foto de la factura como evidencia | 2 | ⬜ | Ningún modelo la lee (ADR 0018) |
| RF-MAN-07..11 | Plan por capas, tarjetas, avisos, revisiones rápidas y concepto del mecánico | 2 | ⬜ | ADR 0016, 0017 y 0020 |
| RF-DOC-01..04 | [Documentos](RF-DOC.md) | 2 | ⬜ | Las fechas ya se guardan desde el registro; vectores listos; 03 y 04 ampliados |
| RF-DOC-05..08 | Extintor y kit, impuesto vehicular, licencia y multas | 2 | ⬜ | Todos son fechas con la lógica de RF-DOC-01 |
| RF-PER-01..05 | [Completar perfil](RF-PER.md) | 4 | ⬜ | Búsqueda con Brave (ADR 0013); 01 a 05 ampliados |
| RF-PER-06..10 | Historia, uso y entorno, banderas, campañas y fuentes por intención | 4 | ⬜ | ADR 0019 |
| RF-COM-01..04 | [Combustible](RF-COM.md) | 5 | ⬜ | Vectores listos |

Archivos: [RF-CTA](RF-CTA.md) · [RF-DAT](RF-DAT.md) · [RF-GAR](RF-GAR.md) · [RF-CAT](RF-CAT.md) · [RF-MIA](RF-MIA.md) · [RF-MAN](RF-MAN.md) · [RF-DOC](RF-DOC.md) · [RF-PER](RF-PER.md) · [RF-COM](RF-COM.md). No funcionales: [rnf.md](../rnf.md). Plan de construcción: [tareas.md](../tareas.md).

## Fuera del MVP

Enlace mágico (entrar solo con un enlace al correo; hay correo y contraseña y Google), directorio de talleres, grúas y servicios (pestaña Servicios del mockup), push del servidor (los avisos son notificaciones locales), pagos, RUNT y consulta automática del SIMIT, OBD, versión web para usuarios, rol administrador, agendamiento en talleres aliados, análisis de fotos y videos con IA (tablero, testigos, facturas; previsto para después del MVP, ADR 0018) y ajustar o entrenar modelos con lo que dice el mecánico.

Entran al MVP con la aprobación del 2026-10-21: voz (solo transcripción de audio, ADR 0018), fotos de factura y tablero solo como evidencia, y el botón "¿Tu mecánico te dijo otra cosa?" como información (RF-MIA-09, RF-MIA-11).

## Decisiones confirmadas

- 2026-10-08: Decreto 019 de 2012, art. 202 vigente para la primera RTM: 5 años desde la matrícula en carros particulares y 2 en motos, luego cada año (RF-DOC-02).
- 2026-10-08: los avisos de vencimiento con notificación local entran en el MVP (RF-DOC-04).
- 2026-10-10: la política de tratamiento de datos queda en [borrador](../legal/politica-tratamiento-datos-BORRADOR.md) para el MVP; la versión final, con asesoría legal, después del MVP.
- 2026-10-10: cuentas con Supabase Auth en vez de identidad por dispositivo; registro con datos mínimos; salud solo con datos suficientes; Mecánico IA conversacional, sin precios por defecto y con límites de uso por balde; avisos insistentes; conflictos sin red: gana lo último validando reglas.

Aprobadas el 2026-10-21 (propuestas por Isaac el 2026-10-19, revisadas por Pablo):

- El kilometraje es siempre el que la persona confirma; no se estima. La app lo pide cada cierto tiempo con una notificación local (RF-GAR-05, RF-GAR-07, ADR 0020).
- El plan se arma por perfil del vehículo y por capas; el catálogo resuelve combustible, transmisión y tracción para no preguntarlos (RF-CAT-04, RF-MAN-01, RF-MAN-07, ADR 0016).
- Lo que el nombre de la línea no dice se investiga por familia en la web con fuente (una oficial o dos que coincidan, revisión del 10 % por lote) y se guarda aparte del catálogo; "TP" en el nombre es transmisión automática; nada se rellena en silencio (RF-CAT-04, RF-CAT-05, ADR 0021).
- El uso sale del registro: queda en "Mixto" y el km por mes en 1.000 hasta que la persona los cambie (RF-GAR-02, RNF-11).
- Cada pieza lleva kilómetros y meses; una pieza de seguridad sin dato que ya pasó el margen del fabricante queda en "Sin dato · revisar ya", no en "Vencida" (RF-MAN-02, RF-MAN-08).
- Un servicio es una factura con varios trabajos; el agente ayuda a armar el historial por texto o voz; la foto de la factura es solo evidencia (RF-MAN-04, 04b, 04c, ADR 0017, ADR 0018).
- Todo documento vencido cuenta para la salud; los avisos no deben saturar (RF-DOC-03, RF-DOC-04).
- La entrevista del perfilador es a profundidad, por bloques y sin tope fijo; el código decide la ramificación y el modelo solo redacta (RF-PER-02, RF-PER-06 a 08).
- Los plazos y las recomendaciones del diagnóstico los fija la app; el agente es neutral. La regla de seguridad se activa con síntomas, no con la sola mención de la pieza (RF-MIA-03, RF-MIA-08).
- El botón del mecánico es información para la persona y contexto para el agente; no retroalimenta ningún modelo (RF-MIA-09).
- D-01: audio por Whisper de Groq solo para transcribir; las fotos no las lee ningún modelo (ADR 0018). Enmienda parcial del ADR 0004 y de CLAUDE.md §8.2; se mantiene §8.7.

## Decisiones por confirmar

- D-02: "datos suficientes" para mostrar el puntaje = más de la mitad de las piezas con dato.
- D-03: bandas de salud oficiales = cuatro (Atención, Revisar, Pronto, Al día).
- D-04: margen para "Sin dato · revisar ya" = el que traiga la ficha del fabricante; sin ficha, el 100 % del intervalo en piezas de seguridad.
- D-05: cadencia del recordatorio de kilometraje = 15 días, configurable en 7, 15 o 30.
- D-06: qué papeles tienen insistencia alta: SOAT, RTM y licencia; el resto, media.
- D-07: vigencia por defecto del concepto del mecánico = 90 días o 3.000 km, lo que llegue primero.
- D-08: si el usuario editó un intervalo y confirma una ficha de la web, se conserva el del usuario.
- D-09: máximo de 8 preguntas por bloque en la entrevista.
- D-10: umbrales de aviso de labrado (2,0 mm en carros, 1,5 mm en motos).
- D-11: revisión legal antes de publicar campañas y fallas conocidas por marca.
