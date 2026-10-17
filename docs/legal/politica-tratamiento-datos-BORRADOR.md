# Política de tratamiento de datos personales de WEVEH

> **BORRADOR · versión 0.1 · NO PUBLICAR.** Base para el flujo de consentimiento del MVP (RF-DAT). La versión final se trabaja **después del MVP con asesoría legal**. Lo marcado `[POR DEFINIR]` necesita una decisión legal o del equipo. Marco: Ley 1581 de 2012, Decreto 1377 de 2013 (compilado en el Decreto 1074 de 2015) y demás normas que los modifiquen.

## 1. Responsable del tratamiento

- **Nombre:** WEVEH `[POR DEFINIR: razón social o persona natural responsable]`
- **Identificación:** `[POR DEFINIR: NIT o cédula]`
- **Domicilio:** `[POR DEFINIR]`, Colombia
- **Correo de contacto para datos personales:** `[POR DEFINIR]`

## 2. Qué datos tratamos

| Tipo | Datos | ¿Obligatorio? |
|---|---|---|
| Identificación y contacto | Nombre y correo electrónico | Sí, para tener una cuenta |
| Datos del vehículo | Tipo, marca, línea, año, kilometraje, uso, fechas de SOAT, revisión técnico-mecánica y seguro, historial de mantenimiento, fallas, tanqueadas; alias y placa (opcionales) | Marca, línea, año y kilometraje; lo demás es opcional |
| Consultas al Mecánico IA | Lo que la persona escribe y las respuestas | Solo si usa el asistente |
| Datos técnicos | Registros de errores y de funcionamiento, sin nombre, correo ni credenciales | Automático |

**No tratamos** cédula, teléfono, ubicación, datos de pago ni datos sensibles. La placa es opcional y nunca se comparte con terceros ni con modelos de IA.

## 3. Para qué los usamos (finalidades)

1. Crear y administrar la cuenta, y verificar la identidad al iniciar sesión.
2. Prestar el servicio: guardar los vehículos, calcular el plan de mantenimiento y los vencimientos, y enviar avisos.
3. Responder las consultas del Mecánico IA con el contexto del vehículo.
4. Investigar el plan de mantenimiento de un modelo de vehículo en fuentes públicas.
5. Mantener la seguridad y el funcionamiento de la app (detección de errores y abusos).
6. Mejorar la app con información agregada que no identifica a nadie.

**No vendemos ni cedemos datos personales** a terceros para publicidad.

## 4. Con quién se comparten (encargados) y transferencia internacional

Los datos se procesan con proveedores que actúan como encargados, con servidores **fuera de Colombia** (transferencia internacional `[POR DEFINIR: base legal y cláusulas con cada proveedor]`):

| Proveedor | Para qué | Qué datos recibe |
|---|---|---|
| Supabase | Base de datos y cuentas | Todos los datos de la cuenta y de los vehículos |
| Render | Servidor de la aplicación | Los datos en tránsito para prestar el servicio |
| OpenRouter y proveedores de modelos de IA gratuitos | Mecánico IA | **Solo** datos del vehículo y el texto de la pregunta; **nunca** nombre, correo, identificador, placa ni alias. Los modelos gratuitos pueden conservar o usar las consultas, por eso la app pide no escribir datos personales en las preguntas |
| Brave Search | Buscar información técnica de un modelo de vehículo | Solo marca, línea, año y cilindrada |
| Sentry | Detección de errores | Datos técnicos sin nombre, correo ni credenciales |
| Google | Iniciar sesión con Google, si la persona lo elige | Lo que Google comparte para identificar la cuenta (nombre y correo) |

## 5. Derechos del titular

La persona puede:
1. **Conocer** sus datos (en la app: Perfil → Mis datos).
2. **Actualizar y rectificar** sus datos (Perfil).
3. **Suprimir** sus datos eliminando la cuenta (Perfil → Eliminar mi cuenta); se borra todo en menos de 24 horas.
4. **Revocar** la autorización (equivale a eliminar la cuenta).
5. **Pedir prueba** de la autorización otorgada.
6. **Ser informada** sobre el uso de sus datos.
7. **Presentar quejas** ante la Superintendencia de Industria y Comercio (SIC), después de haber consultado o reclamado ante WEVEH.

## 6. Cómo ejercer los derechos (procedimiento)

- Desde la app (Perfil) o escribiendo a `[POR DEFINIR: correo de contacto]`.
- **Consultas:** respuesta en máximo **10 días hábiles** (prorrogables 5 más, informando el motivo).
- **Reclamos** (corrección, actualización, supresión o incumplimiento): respuesta en máximo **15 días hábiles** (prorrogables 8 más, informando el motivo).

## 7. Autorización

Se pide al crear la cuenta con una **casilla sin marcar**: "Acepto la política de tratamiento de datos personales". Sin aceptarla no se puede crear la cuenta. Se guarda la fecha, la versión de esta política y el medio (RF-DAT-01, 02). Si la política cambia, se pide aceptar la nueva versión al entrar (RF-DAT-03).

## 8. Seguridad

Contraseñas gestionadas por Supabase Auth (nunca las guarda WEVEH), comunicación cifrada (HTTPS), base de datos sin acceso público (RLS), mínimos datos personales y ningún dato personal en los registros técnicos ni en las consultas a la IA.

## 9. Conservación

Los datos se conservan mientras la cuenta esté activa. Al eliminarla, se borran en menos de 24 horas. `[POR DEFINIR: plazo de conservación de copias de respaldo y de registros técnicos]`.

## 10. Vigencia y cambios

- **Versión:** 0.1-borrador · **Fecha:** 2026-10-10 · `[POR DEFINIR: fecha de entrada en vigencia]`
- Los cambios importantes se informan en la app y requieren aceptar la nueva versión.
