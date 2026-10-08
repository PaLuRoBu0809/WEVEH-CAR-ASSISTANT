# ADR 0002 — Identidad por dispositivo, sin login

- **Estado:** aceptada
- **Fecha:** 2026-10-08
- **Autores:** Isaac Cano, Pablo Rodríguez

## Contexto

La competencia (Garage Hub, Drivoo, Partes, Pits) muestra que la fricción en el registro hace que la gente abandone antes de ver valor. El MVP debe dejar registrar un vehículo en menos de 2 minutos. Un login con correo o redes agrega pantallas, manejo de contraseñas, datos personales y obligaciones de la Ley 1581 de 2012 (protección de datos) que no aportan a la demo.

## Decisión

1. En el primer arranque la app genera un `dispositivoId` (UUID v4 con `crypto.randomUUID()`) y lo guarda en SecureStore bajo la llave `weveh.dispositivoId`.
2. Toda llamada a `/api/**` envía el header `X-Weveh-Dispositivo`.
3. El backend tiene un filtro (`FiltroDispositivo`) que exige el header y valida que sea UUID v4. Si falta o no es válido responde **400** con Problem Details (RFC 9457).
4. Cada caso de uso recibe un `DispositivoId` y filtra por él. Un recurso de otro dispositivo responde **404**, no 403, para no revelar que existe.
5. No se guardan nombre, correo, cédula ni teléfono. La placa es opcional.

## Alternativas consideradas

- **Supabase Auth anónimo**: da un JWT firmado, pero acopla la app a Supabase (que decidimos no exponer) y agrega dependencia para algo que el MVP no necesita.
- **Login con correo o Google desde el día uno**: más seguro, pero rompe la meta de registro sin fricción y obliga a tratar datos personales.

## Consecuencias

- **No es autenticación real.** Quien conozca un `dispositivoId` ajeno puede leer esos datos. Es aceptable porque no hay datos personales sensibles; no se debe guardar nada que cambie ese análisis.
- Si la persona desinstala la app o cambia de celular, pierde el acceso a sus datos. Debe quedar escrito en la pantalla de ajustes.
- Cuando llegue el login, la cuenta se vincula al `dispositivoId` existente y se migran los vehículos.
- Al modelo de IA nunca se le envía el `dispositivoId` ni la placa.
