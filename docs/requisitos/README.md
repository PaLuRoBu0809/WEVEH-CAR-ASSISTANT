# Requisitos funcionales del MVP

Formato ISO/IEC/IEEE 29148: historia de usuario y criterios de aceptación en Gherkin (Dado / Cuando / Entonces). Cada PR enlaza los IDs que cubre, y cada criterio se cubre con al menos una prueba.

Estados: **Pendiente** → **En curso** → **Hecho** (criterios cubiertos por pruebas y probado en Android o iOS).

| ID | Requisito | Fase | Estado |
|---|---|---|---|
| RF-GAR-00 | Identidad por dispositivo | 0 | Pendiente |
| RF-GAR-01 | Ver mi garaje | 0 / 1 | Pendiente |
| RF-CAT-01 | Buscar marcas | 1 | Pendiente |
| RF-CAT-02 | Buscar líneas de una marca | 1 | Pendiente |
| RF-CAT-03 | Importar el catálogo | 1 | Pendiente |
| RF-GAR-02 | Registrar vehículo (registro básico) | 1 | Pendiente |
| RF-GAR-03 | Editar vehículo | 1 | Pendiente |
| RF-GAR-04 | Eliminar vehículo | 1 | Pendiente |
| RF-GAR-05 | Actualizar kilometraje | 2 | Pendiente |
| RF-MAN-01 | Plan genérico al registrar | 2 | Pendiente |
| RF-MAN-02 | Estado de cada pieza | 2 | Pendiente |
| RF-MAN-03 | Salud del vehículo | 2 | Pendiente |
| RF-MAN-04 | Registrar un servicio | 2 | Pendiente |
| RF-MAN-05 | Ver historial | 2 | Pendiente |
| RF-MAN-06 | Editar un intervalo | 2 | Pendiente |
| RF-DOC-01 | Calcular vencimientos | 2 | Pendiente |
| RF-DOC-02 | RTM que aún no aplica | 2 | Pendiente |
| RF-DOC-03 | Estado de cada documento | 2 | Pendiente |
| RF-DOC-04 | Avisos de vencimiento (notificación local) | 2 | Pendiente |
| RF-MIA-01 | Preguntar por un síntoma | 3 | Pendiente |
| RF-MIA-02 | Contexto completo del vehículo | 3 | Pendiente |
| RF-MIA-03 | Regla de seguridad | 3 | Pendiente |
| RF-MIA-04 | Respuestas seguras ante fallas | 3 | Pendiente |
| RF-MIA-05 | Perfil incompleto | 3 | Pendiente |
| RF-MIA-06 | Trazabilidad | 3 | Pendiente |
| RF-PER-01 | Investigar el modelo | 4 | Pendiente |
| RF-PER-02 | Entrevista corta | 4 | Pendiente |
| RF-PER-03 | Confirmar lo propuesto | 4 | Pendiente |
| RF-PER-04 | Seguridad durante la entrevista | 4 | Pendiente |
| RF-PER-05 | Límite de uso | 4 | Pendiente |
| RF-COM-01 | Registrar tanqueada | 5 | Pendiente |
| RF-COM-02 | Primer tanque lleno | 5 | Pendiente |
| RF-COM-03 | Calcular consumo | 5 | Pendiente |
| RF-COM-04 | ¿Es normal mi consumo? | 5 | Pendiente |

Archivos: [RF-GAR](RF-GAR.md) · [RF-CAT](RF-CAT.md) · [RF-MAN](RF-MAN.md) · [RF-DOC](RF-DOC.md) · [RF-MIA](RF-MIA.md) · [RF-PER](RF-PER.md) · [RF-COM](RF-COM.md). No funcionales: [rnf.md](../rnf.md).

## Fuera del MVP

Login y cuentas, directorio de talleres, grúas y servicios, voz, foto de testigos, push del servidor, pagos, RUNT, OBD, versión web, botón "¿El mecánico te dijo otra cosa?" (README) y agendamiento en talleres aliados.

## Pendientes de decisión

- Confirmar la vigencia del Decreto 019 de 2012, art. 202, para la primera RTM (RF-DOC-02).
- Confirmar que los avisos de RF-DOC-04 con notificaciones locales entran en el MVP (la skill fija ventanas de 30, 7 y 1 día; el alcance solo excluye el push del servidor).
