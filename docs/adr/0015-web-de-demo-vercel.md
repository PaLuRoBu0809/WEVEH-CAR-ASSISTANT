# ADR 0015 — Web de demo en Vercel

- **Estado:** aceptada (precisa el ADR 0011: el navegador ya no es solo para desarrollo)
- **Fecha:** 2026-10-15
- **Autores:** Isaac Cano, Pablo Rodríguez

## Contexto

WEVEH es una app móvil (Expo). Para mostrarla en el curso y a personas que no tienen la app instalada se necesita un enlace que abra en cualquier navegador. El código ya compila para web con `react-native-web`, pero hasta ahora la versión web estaba fuera del MVP (`CLAUDE.md`, ADR 0011).

## Decisión

- La versión web se publica en **Vercel como demo**, no como producto: sirve para mostrar y probar, y las decisiones de diseño siguen pensadas para el celular.
- Proyecto `weveh-car-assistant-mobile`, raíz `mobile/`, rama de producción **`dev/pablo`** (cada push la redespliega). Dominio: `https://weveh-car-assistant-mobile.vercel.app`.
- Se construye con `npx expo export --platform web` como **una sola página** (`app.json` → `web.output: "single"`); `mobile/vercel.json` reescribe toda ruta a `index.html` para que funcionen las rutas con `[id]`.
- Variables en Vercel (todas públicas, quedan dentro del JavaScript): `EXPO_PUBLIC_API_URL` (Render), `EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY`. Nunca una llave secreta.
- El backend permite ese origen con `WEVEH_CORS_ORIGENES` en Render.
- Supabase Auth usa el dominio de Vercel como **Site URL**: el enlace de verificación del correo abre la web de demo.

## Alternativas consideradas

- **Solo APK con EAS:** es lo que pide el MVP para celulares, pero no da un enlace para mostrar en cualquier equipo. Sigue pendiente (ADR 0011) y no se reemplaza.
- **Render para la web también:** posible como sitio estático, pero Vercel despliega por rama sin configuración extra y sin dormirse.

## Consecuencias

- **Seguridad menor que en el celular:** en web la sesión se guarda en `localStorage` del navegador, no en el almacenamiento cifrado (`shared/almacen/almacen.web.ts`). Aceptable para una demo; no para usuarios reales.
- Toda pantalla nueva debe verse aceptable en el navegador; las funciones propias del celular (SQLite sin red, notificaciones) no aplican en la web.
- El backend en Render gratis se duerme: la primera visita después de 15 minutos tarda ~1 minuto en responder.
- `CLAUDE.md` mantiene "versión web para usuarios" fuera del MVP; la demo no cambia eso.
