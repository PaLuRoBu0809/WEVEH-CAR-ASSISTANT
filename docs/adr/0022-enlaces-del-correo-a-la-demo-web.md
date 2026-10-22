# ADR 0022 — Enlaces del correo a la demo web, Google con PKCE y Brevo como SMTP

- **Estado:** propuesta (2026-10-21)
- **Fecha:** 2026-10-21
- **Autores:** Isaac Cano, Pablo Rodríguez

## Contexto

Faltaban RF-CTA-02 (Google), RF-CTA-03 (recuperar contraseña), RF-CTA-04 (correo sin verificar) y RF-DAT-01 (leer la política y aceptarla al entrar con Google). Los correos de Supabase traen un enlace, y hay que decidir a dónde lleva:

- `weveh://` solo funciona si la app propia está instalada (development build, ADR 0011); en Expo Go la dirección es `exp://<ip>:8081`, distinta en cada equipo.
- La persona a veces abre el correo en un computador.
- La demo web ya existe en Vercel ([ADR 0015](0015-web-de-demo-vercel.md)) y `vercel.json` reescribe cualquier ruta a `index.html`: las pantallas de Expo Router sirven tal cual.

Con PKCE, el `?code=` que trae la URL solo se puede canjear en el navegador o celular que pidió el correo, porque ahí quedó guardado el verificador. Pedir el enlace en el celular y abrirlo en el computador fallaría.

Supabase tiene **un solo** vencimiento para todos los enlaces del correo y no deja pedir otro correo antes de **60 segundos**.

## Decisión

1. **Los enlaces del correo abren páginas de la demo web**: `/nueva-contrasena` y `/cuenta-confirmada`. Site URL de Supabase = la demo.
2. **Las plantillas llevan `token_hash`**, no `{{ .ConfirmationURL }}`: `{{ .SiteURL }}/nueva-contrasena?token_hash={{ .TokenHash }}&type=recovery`. La página lo verifica con `verifyOtp`, que funciona en cualquier equipo y no lo gastan los antivirus de correo que abren los enlaces (la verificación la hace el JavaScript de la página, no la visita). Plantillas en `docs/correos/`.
3. **Google con PKCE** (`flowType: 'pkce'`): ida y vuelta pasan en el mismo equipo. En la web, Google vuelve a `/auth/callback`; en el celular, `expo-web-browser` abre una ventana que vuelve a la app (`weveh://auth/callback` o `exp://…/--/auth/callback`) y la app canjea el código.
4. Vencimiento de los enlaces: **1 hora** (Email OTP expiration = 3600), igual para confirmar y recuperar. "Reenviar" se bloquea 60 segundos.
5. Al guardar la contraseña nueva se cierran las demás sesiones (`signOut({ scope: 'others' })`). Al confirmar el correo se cierra la sesión que abre el enlace: el perfil se crea al iniciar sesión, por el mismo camino de siempre.
6. "Enlace enviado" nunca dice si la cuenta existe: el mismo texto aunque Supabase falle, salvo el límite de envíos.
7. Quien entra por primera vez con Google no pasó por la casilla del registro: ve "Antes de entrar" y el perfil se crea con `medio = APP_GOOGLE` (migración V9). Si cierra la app sin aceptar, las pestañas lo devuelven a esa pantalla.
8. **Brevo como SMTP** de Supabase (`smtp-relay.brevo.com`, puerto 587), remitente `contactoweveh@gmail.com` con nombre "WEVEH". El SMTP de prueba de Supabase solo envía a los correos del equipo y muy pocos por hora.

## Alternativas consideradas

- **Enlaces a `weveh://`**: no sirven en Expo Go ni en un computador.
- **`{{ .ConfirmationURL }}` con PKCE**: el enlace falla si se abre en otro equipo, y un antivirus que visite el enlace lo gasta antes que la persona.
- **Flujo implícito (tokens en el `#` de la URL)**: Supabase lo desaconseja para apps móviles y no protege el regreso de Google.
- **El SMTP propio de Supabase**: límite de pocos correos por hora y solo a miembros del proyecto; no sirve para la demo.

## Consecuencias

- Las páginas de los correos son las de la demo web: un cambio en ellas se publica con el despliegue de Vercel.
- Para probar en Expo Go, el correo lleva a la demo publicada, no al código local.
- Redirect URLs de Supabase: `https://<demo>/**`, `weveh://**` y `exp://**`.
- La franja del correo (sol, carretera y la W del mockup) es un PNG servido desde la demo (`mobile/public/correo/cabecera.png`), porque Gmail y otros clientes no muestran SVG. Se regenera con una captura de `docs/correos/cabecera.html` a escala 2 (Chrome sin ventana). Si la imagen no carga, se ve la franja oscura con "weveh" como texto alternativo.
- Si algún día hay dominio propio, se cambia la Site URL y el remitente sin tocar el código.
