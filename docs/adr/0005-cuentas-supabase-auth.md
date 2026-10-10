# ADR 0005 — Cuentas de usuario con Supabase Auth

- **Estado:** aceptada (reemplaza el [ADR 0002](0002-identidad-por-dispositivo.md))
- **Fecha:** 2026-10-10
- **Autores:** Isaac Cano, Pablo Rodríguez

## Contexto

La identidad por dispositivo (ADR 0002) sirvió para la demo, pero no es una cuenta: si la persona desinstala la app o cambia de celular pierde sus datos, y quien conozca el identificador puede ver lo ajeno. WEVEH necesita que la persona se registre, sea dueña de su cuenta y de sus vehículos, y que sus datos se traten conforme a la Ley 1581 de 2012.

## Decisión

- **Supabase Auth** maneja las cuentas: registro con nombre, correo y contraseña (verificación por correo), **Google** y **enlace mágico** por correo, recuperación de contraseña y sesiones. Si una persona entra por distintos métodos con el mismo correo verificado, es la misma cuenta.
- **Un solo rol: usuario.** No hay administrador en el MVP; las tareas administrativas se hacen con scripts o en el panel de Supabase.
- **La app habla con Supabase solo para iniciar sesión** (`@supabase/supabase-js`, auth). Nunca lee ni escribe datos en Supabase: eso sigue pasando por la API.
- **El backend valida el token** (JWT firmado por Supabase) con Spring Security como servidor de recursos OAuth2, usando las llaves públicas del proyecto (JWKS). Del token sale el `usuarioId`; toda consulta se filtra por él. Un recurso de otro usuario responde **404**; un token ausente, vencido o alterado responde **401**.
- **Datos mínimos:** nombre y correo. Nada de cédula ni teléfono; la placa sigue siendo opcional.
- **Módulo `cuentas`** en el backend: perfil (nombre), consentimientos (versión de la política, fecha, medio), eliminar la cuenta y todo lo suyo.
- **Acciones delicadas** (eliminar la cuenta, cambiar el correo) piden volver a confirmar la identidad.
- **Al cerrar sesión** se borran los datos guardados en el celular ([ADR 0009](0009-sin-red-sqlite.md)).
- Las cuentas se prueban en el **emulador de Android Studio con una app propia (development build)**, porque Google y el enlace mágico necesitan volver a la app por `weveh://`, algo limitado en Expo Go ([ADR 0011](0011-diseno-y-entornos-de-prueba.md)).
- Los vehículos creados con `dispositivoId` eran de prueba y se borran al migrar.

## Alternativas consideradas

- **Mantener el `dispositivoId`:** no es una cuenta.
- **Supabase Auth anónimo:** crea un usuario real sin correo que luego se puede convertir; más seguro que el `dispositivoId`, pero sigue sin ser una cuenta desde el inicio.
- **Login propio en Spring:** guardar contraseñas, verificación, recuperación y Google en nuestro código; más trabajo y más riesgo.
- **Firebase Auth, Clerk o Auth0:** equivalentes, pero suman otro proveedor.

## Consecuencias

- La regla "la app nunca habla con Supabase" tiene una excepción documentada: iniciar sesión.
- WEVEH pasa a tratar datos personales: hay que publicar una política de tratamiento (revisada con asesoría legal) y cumplir RF-DAT.
- Google requiere credenciales en Google Cloud configuradas en Supabase (las crea el equipo con su cuenta).
- Plan gratis de Supabase Auth: hasta 50.000 usuarios activos al mes.
