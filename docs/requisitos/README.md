# Requisitos funcionales del MVP

Formato ISO/IEC/IEEE 29148: historia de usuario y criterios de aceptación en Gherkin (Dado / Cuando / Entonces). Cada PR enlaza los IDs que cubre y cada criterio se cubre con al menos una prueba.

**Estados:** ✅ Hecho (criterios cubiertos por pruebas) · 🟡 Parcial (qué falta en la nota) · ⬜ Pendiente · 🔁 Hecho pero cambia por una decisión nueva

Estado revisado el 2026-10-10.

| ID | Requisito | Fase | Estado | Nota |
|---|---|---|---|---|
| ~~RF-GAR-00~~ | ~~Identidad por dispositivo~~ | 0 | 🔁 | Reemplazado por RF-CTA (ADR 0005) |
| RF-CTA-01..07 | [Cuentas](RF-CTA.md) | 1 | ⬜ | |
| RF-DAT-01..08 | [Tratamiento de datos](RF-DAT.md) | 1 | 🟡 | 08: ya no van placa, alias ni identificador al modelo; falta el aviso en Preguntar y lo de nombre y correo |
| RF-GAR-01 | Ver mi garaje | 0 / 1 | 🟡 | Falta ver sin red (ADR 0009) |
| RF-GAR-02 | Registrar vehículo (datos mínimos) | 1 | 🔁 | Hoy exige aceite, SOAT y RTM; pasan a opcionales |
| RF-GAR-02b | Completar lo que falta | 1 / 2 | ⬜ | |
| RF-GAR-03 | Editar vehículo | 1 | 🟡 | El backend edita; falta la pantalla y "gana lo último" |
| RF-GAR-04 | Eliminar vehículo | 1 | ✅ | Plan, documentos y tanqueadas se borrarán en cascada cuando existan |
| RF-GAR-05 | Actualizar kilometraje | 2 | ⬜ | |
| RF-GAR-06 | Cambios sin red | 1 | ⬜ | |
| RF-CAT-01 | Buscar marcas | 1 | 🟡 | Falta la caché sin red |
| RF-CAT-02 | Buscar líneas de una marca | 1 | ✅ | |
| RF-CAT-03 | Importar y actualizar el catálogo | 1 | 🟡 | 2025 cargado con script; falta el proceso por año fiscal (ADR 0014) |
| RF-MIA-01 | Preguntar por un síntoma | 1 | 🔁 | Funciona; cambia a estructura de 3 pasos y sin precios |
| RF-MIA-01b | ¿Cuánto podría costar? | 1 | ⬜ | |
| RF-MIA-01c | Acciones desde el diagnóstico | 2 | ⬜ | Necesita plan e historial |
| RF-MIA-02 | Conversación con memoria | 1 | ⬜ | Hoy es una pregunta y una respuesta |
| RF-MIA-03 | Regla de seguridad | 1 | ✅ | |
| RF-MIA-04 | Respuestas seguras ante fallas | 1 | 🟡 | Falta el cortacircuitos ("mucha demanda" al instante) |
| RF-MIA-05 | Datos que faltan | 1 | ⬜ | |
| RF-MIA-06 | Trazabilidad | 1 | ✅ | Incluye el modelo que respondió |
| RF-MIA-07 | Límites de uso que no estorban | 1 | 🔁 | Hoy: 30 por vehículo al día; cambia a balde por cuenta |
| RF-MAN-01..06 | [Mantenimiento](RF-MAN.md) | 2 | ⬜ | Vectores listos en `contracts/` |
| RF-DOC-01..04 | [Documentos](RF-DOC.md) | 2 | ⬜ | Las fechas ya se guardan desde el registro; vectores listos |
| RF-PER-01..05 | [Completar perfil](RF-PER.md) | 4 | ⬜ | Búsqueda con Brave (ADR 0013) |
| RF-COM-01..04 | [Combustible](RF-COM.md) | 5 | ⬜ | Vectores listos |

Archivos: [RF-CTA](RF-CTA.md) · [RF-DAT](RF-DAT.md) · [RF-GAR](RF-GAR.md) · [RF-CAT](RF-CAT.md) · [RF-MIA](RF-MIA.md) · [RF-MAN](RF-MAN.md) · [RF-DOC](RF-DOC.md) · [RF-PER](RF-PER.md) · [RF-COM](RF-COM.md). No funcionales: [rnf.md](../rnf.md). Plan de construcción: [tareas.md](../tareas.md).

## Fuera del MVP

Directorio de talleres, grúas y servicios (pestaña Servicios del mockup), voz, foto de testigos, push del servidor, pagos, RUNT, OBD, versión web para usuarios, rol administrador, botón "¿El mecánico te dijo otra cosa?" (README original) y agendamiento en talleres aliados.

## Decisiones confirmadas

- 2026-10-08: Decreto 019 de 2012, art. 202 vigente para la primera RTM: 5 años desde la matrícula en carros particulares y 2 en motos, luego cada año (RF-DOC-02).
- 2026-10-08: los avisos de vencimiento con notificación local entran en el MVP (RF-DOC-04).
- 2026-10-10: cuentas con Supabase Auth en vez de identidad por dispositivo; registro con datos mínimos; salud solo con datos suficientes; Mecánico IA conversacional, sin precios por defecto y con límites de uso por balde; avisos insistentes; conflictos sin red: gana lo último validando reglas.
