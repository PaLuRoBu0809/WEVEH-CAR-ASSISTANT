# RF-DAT — Tratamiento de datos personales (Ley 1581 de 2012)

Decisión: [ADR 0005](../adr/0005-cuentas-supabase-auth.md). Política: [borrador 0.1](../legal/politica-tratamiento-datos-BORRADOR.md), que se usa en el flujo de consentimiento del MVP; la versión final se trabaja con asesoría legal **después del MVP**, antes de tener usuarios reales.

## RF-DAT-01 Aceptar la política
- Dado que creo mi cuenta
  Cuando veo la casilla "Acepto la política de tratamiento de datos personales"
  Entonces está sin marcar y sin marcarla no puedo crear la cuenta
- Dado la casilla
  Cuando toco "política de tratamiento"
  Entonces puedo leerla completa

## RF-DAT-02 Registro de la autorización
- Dado que acepto la política
  Cuando se crea la cuenta
  Entonces queda guardado cuándo acepté, qué versión de la política y por qué medio

## RF-DAT-03 Nueva versión de la política
- Dado que la política cambió desde que la acepté
  Cuando entro a la app
  Entonces se me pide aceptar la nueva versión antes de seguir

## RF-DAT-04 Consultar mis datos
- Dado que abro Perfil
  Cuando toco "Mis datos"
  Entonces veo qué datos personales tiene WEVEH de mí y para qué se usan

## RF-DAT-05 Corregir mis datos
- Dado que mi nombre o correo están mal
  Cuando los edito
  Entonces quedan corregidos (RF-CTA-07)

## RF-DAT-06 Eliminar mi cuenta
- Dado que toco "Eliminar mi cuenta" y confirmo mi identidad
  Cuando confirmo
  Entonces se borran mi cuenta, mis vehículos, conversaciones, historial y demás datos en menos de 24 horas, y se cierra la sesión en el celular

## RF-DAT-07 Revocar la autorización
- Dado que ya no quiero que WEVEH trate mis datos
  Cuando revoco la autorización
  Entonces equivale a eliminar mi cuenta (RF-DAT-06), con el aviso de lo que implica

## RF-DAT-08 Datos mínimos y privacidad con la IA
- Dado cualquier consulta al Mecánico IA o al agente
  Cuando se envía al modelo
  Entonces no incluye mi nombre, correo, identificador, placa ni alias
- Dado la pantalla Preguntar
  Cuando la abro
  Entonces veo el aviso "No escribas datos personales en tu pregunta"
- Dado los registros técnicos (logs) y el monitoreo de errores
  Cuando se guardan
  Entonces no contienen nombre, correo, token ni llaves
