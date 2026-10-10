# ADR 0011 — Diseño según los mockups y entornos de prueba de la app

- **Estado:** aceptada
- **Fecha:** 2026-10-10
- **Autores:** Isaac Cano, Pablo Rodríguez

## Contexto

Los mockups `WEVEH Portada.html` y `WEVEH Garaje.html` (raíz del repo) definen la identidad visual. Algunas partes quedan fuera del MVP. Además, el equipo necesita probar la app sin depender de que el celular y el PC estén en la misma red.

## Decisión

### Diseño

- Tokens exactos de los mockups (`mobile/src/shared/design-system/tokens.ts`), fuentes Manrope y JetBrains Mono, componentes del sistema de diseño (Texto, Boton, Campo, Pildora, Barra, Tarjeta, LogoW).
- **Tema claro por defecto**; el oscuro se elige con la luna o en Perfil y se recuerda. Las escenas de marca (encendido, portada) son siempre oscuras.
- **Portada con "Crear mi cuenta" y "Ya tengo cuenta"** y las pantallas de inicio de sesión y registro del mockup (dial y trama de W), con la casilla de política de datos sin marcar ([ADR 0005](0005-cuentas-supabase-auth.md)).
- **Pestañas Inicio, Garaje y Perfil** con el botón flotante "Preguntar". **Sin la pestaña Servicios** (talleres, grúas): fuera del MVP. El combustible vive en el detalle del vehículo (segmento "Gasolina").
- Elementos que no están en los mockups (botón "¿Cuánto podría costar?", aviso de privacidad, aviso de notificaciones desactivadas) se diseñan con los mismos tokens.

### Entornos de prueba

- **Emulador de Android Studio** como entorno principal: Expo lo abre con `a`; desde el emulador el backend local está en `http://10.0.2.2:8080`.
- **App propia (development build con EAS)** para probar Google, el enlace mágico y las notificaciones, que en Expo Go son limitados.
- **Navegador del PC solo para desarrollo:** `react-native-web`, CORS configurable (`WEVEH_CORS_ORIGENES`, vacío por defecto) y el almacenamiento seguro reemplazado por `localStorage`. No es la "versión web" que el alcance excluye.
- iOS se prueba en un iPhone real (el simulador requiere Mac).

## Alternativas consideradas

- **BlueStacks:** pensado para juegos; Expo no lo reconoce y tiene problemas de red con el backend local.
- **Solo Expo Go en el celular:** depende de la red y no permite probar Google ni el enlace mágico.

## Consecuencias

- Generar la app propia requiere una cuenta de Expo (EAS, con plan gratis limitado).
- El emulador necesita Android Studio instalado (unos GB de disco).
