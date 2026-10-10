# RF-CTA — Cuentas

Decisión: [ADR 0005](../adr/0005-cuentas-supabase-auth.md). Pantallas: mockup `WEVEH Portada.html` (crear cuenta, iniciar sesión). Un solo rol: usuario.

## RF-CTA-01 Crear cuenta
Como dueño quiero crear mi cuenta para que mis vehículos sean míos.
- Dado que escribo nombre, correo, una contraseña de 8 caracteres o más y acepto la política de datos
  Cuando toco "Crear cuenta"
  Entonces se crea la cuenta y me llega un correo para verificarla
- Dado que no acepto la política
  Cuando intento crear la cuenta
  Entonces el botón no se activa (RF-DAT-01)
- Dado un correo que ya tiene cuenta
  Cuando intento crear otra
  Entonces veo que ya existe y la opción de iniciar sesión

## RF-CTA-02 Iniciar sesión
Como dueño quiero entrar de la forma que me resulte más cómoda.
- Dado mi correo y contraseña correctos
  Cuando toco "Entrar"
  Entonces entro a mi Inicio
- Dado que toco "Continuar con Google"
  Cuando apruebo en Google
  Entonces entro con mi cuenta
- Dado que pido un enlace mágico a mi correo
  Cuando abro el enlace en el celular
  Entonces entro sin contraseña
- Dado un correo o contraseña incorrectos
  Cuando toco "Entrar"
  Entonces veo "Correo o contraseña incorrectos" sin decir cuál de los dos

## RF-CTA-03 Recuperar contraseña
- Dado que olvidé mi contraseña
  Cuando la pido de nuevo con mi correo
  Entonces me llega un enlace para crear una nueva

## RF-CTA-04 Sesión segura
Como dueño quiero que nadie más use mi cuenta.
- Dado que mi correo no está verificado
  Cuando intento usar la app
  Entonces se me pide verificarlo
- Dado que mi sesión expiró
  Cuando abro la app
  Entonces se renueva sola o se me pide iniciar sesión de nuevo
- Dado un token ausente, vencido o alterado
  Cuando llega a la API
  Entonces responde 401

## RF-CTA-05 Confirmar identidad en acciones delicadas
- Dado que voy a eliminar mi cuenta o cambiar mi correo
  Cuando confirmo
  Entonces se me pide volver a verificar mi identidad

## RF-CTA-06 Cerrar sesión
- Dado que cierro sesión
  Cuando vuelvo a la portada
  Entonces los datos guardados en el celular se borran

## RF-CTA-07 Gestionar mi cuenta
- Dado que abro Perfil
  Cuando edito mi nombre o mi correo
  Entonces se actualizan (el correo nuevo se verifica)
