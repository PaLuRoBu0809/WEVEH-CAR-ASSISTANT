# ADR 0020 — Avisos locales de mantenimiento y kilometraje confirmado

- **Estado:** aceptada (2026-10-21)
- **Fecha:** 2026-10-19
- **Autores:** Isaac Cano, Pablo Rodríguez

## Contexto

El plan de mantenimiento depende del kilometraje, que lo escribe la persona. Una estimación (km promedio al mes) puede estar muy lejos de la realidad (alguien que dice 1.000 km al mes y no usa el carro), y una app que avisa con datos inventados pierde validez. Al mismo tiempo, hay que avisar antes de que algo se pase sin llenar de notificaciones. La decisión del 2026-10-08 ya incluyó los avisos de vencimiento con notificación local; el push del servidor sigue fuera del MVP.

## Decisión

- **El kilometraje es siempre el confirmado por la persona.** La app no estima el kilometraje de hoy. Si la última lectura es vieja, lo dice ("confirmado hace X días") y calcula con ese valor.
- **Cómo llega el kilometraje:** lo escribe la persona; lo actualizan un servicio (RF-MAN-04) y una tanqueada (RF-COM-01); y una **notificación local periódica** lo pide ("¿cuántos km marca hoy?", cada 15 días por defecto, configurable). La foto del tablero es solo evidencia (ADR 0018).
- **Avisos por tiempo:** se programan como notificaciones locales con la fecha del último servicio más el intervalo en meses.
- **Avisos por kilómetros:** no se programan por fecha estimada; se disparan cuando llega una lectura nueva y la pieza pasa del 85 % o del 100 %, con el texto del kilometraje usado.
- **Menos es más:** un aviso en "Ya casi toca", otro al vencer y uno semanal solo para piezas de seguridad; avisos agrupados en una notificación; máximo dos notificaciones por día entre mantenimiento y documentos (RNF-37).
- **Tope del sistema:** se programan solo las más próximas (máximo 20) y se completan al abrir la app (RNF-32).
- **Sin push del servidor.** Si la persona niega el permiso o cambia de celular, la app lo dice y se recalcula al iniciar sesión.

## Alternativas consideradas

- **Estimar el kilometraje con el km promedio al mes:** permite avisar por fecha, pero pierde confiabilidad y rompe la regla de que el kilometraje no baja cuando la persona escribe un valor real menor.
- **Push del servidor:** llegaría aunque la app esté cerrada, pero exige tokens de dispositivo, un programador en el backend y está fuera del MVP.
- **Leer el tablero con visión:** descartado por ahora (ADR 0018).

## Consecuencias

- La skill `dominio-vehiculo` debe dejar de hablar del "próximo servicio según el km/mes estimado": muestra los kilómetros que faltan, no una fecha.
- El km promedio al mes se usa solo para detectar saltos raros (RF-GAR-05).
- Hay que verificar en Android 13 o superior y en iOS el comportamiento real de los permisos y el tope de notificaciones.
