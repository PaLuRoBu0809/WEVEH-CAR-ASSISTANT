# ADR 0023 — Corregir la última lectura del kilometraje

- **Estado:** aceptada (2026-10-22)
- **Fecha:** 2026-10-22
- **Autores:** Isaac Cano, Pablo Rodríguez

## Contexto

Hasta ahora el kilometraje nunca bajaba (CLAUDE.md §6, RF-GAR-05). La regla protege el plan de mantenimiento: un número inflado lo haría creer que el vehículo anduvo más. Pero también deja sin salida un error real. Un salto raro pide confirmación, pero un error que pasa el umbral (por ejemplo 136.200 en vez de 135.200, menos de 1.500 km) o uno que la persona confirma sin mirar queda guardado para siempre.

El sistema no tenía historial: solo guardaba el kilometraje actual y el día de la lectura.

## Decisión

- **Se puede corregir la última lectura hacia abajo durante los 7 días siguientes a anotarla.** Después queda fija.
- **El piso es la lectura anterior:** una corrección nunca deja el kilometraje por debajo de lo que ya se había anotado antes. Si la última es la primera (la del registro), el piso es 0.
- **Para subir se anota una lectura nueva**, con sus reglas de siempre (salto raro, "gana lo último").
- **Solo con red.** Un kilometraje que todavía espera red se puede **cancelar** desde la misma tarjeta (ADR 0009).
- **Historial:** tabla `lectura_kilometraje` (V11), con cada lectura (km, día, si fue corregida). Arranca con la lectura actual de cada vehículo.
- Endpoint `PUT /vehiculos/{id}/kilometraje/correccion`. Publica `KilometrajeActualizado`, como cualquier cambio del kilometraje, para que el plan se recalcule.
- En la app: "¿Te equivocaste? Corregir esta lectura" aparece solo mientras se puede corregir.

## Alternativas consideradas

- **Bajar a cualquier valor:** más simple, pero permite "rebobinar" el vehículo sin límite y deja el plan mal.
- **Solo la última lectura, sin límite de días:** más flexible, pero un error viejo ya pudo disparar avisos y servicios; corregirlo meses después confunde el historial.
- **No permitir correcciones:** la regla anterior; deja sin salida los errores reales.

## Consecuencias

- La regla "nunca baja" pasa a ser "nunca baja, salvo corregir la última lectura en sus primeros 7 días". Se actualizan CLAUDE.md §6, RF-GAR-05 y la skill de dominio.
- El historial de lecturas sirve después para el plan (consumo de km por mes real) y para "Kilometraje confirmado hace X días".
- El plan de mantenimiento, cuando exista, debe escuchar `KilometrajeActualizado` también cuando el kilometraje baja.
