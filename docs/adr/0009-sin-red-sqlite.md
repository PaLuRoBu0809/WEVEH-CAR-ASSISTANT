# ADR 0009 — Funcionamiento sin red con SQLite

- **Estado:** aceptada
- **Fecha:** 2026-10-10
- **Autores:** Isaac Cano, Pablo Rodríguez

## Contexto

La persona revisa su vehículo en el taller, en la carretera o donde no hay señal. Debe poder ver lo último que sabía la app y anotar cosas aunque no haya internet.

## Decisión

- **SQLite en el celular** (`expo-sqlite`) guarda el **último estado de todo**: vehículos, plan y estados de piezas, documentos y vencimientos, historial de servicios y fallas, y las conversaciones con el Mecánico IA.
- **Lectura:** las pantallas leen primero de SQLite (abren al instante) y TanStack Query pide los datos frescos al backend en segundo plano; al llegar, actualiza SQLite y la pantalla. Sin red se muestra "Sin conexión · actualizado hace X".
- **Escritura sin red:** los cambios van a una **cola** en SQLite y se envían solos al volver la conexión, cada uno con un `Idempotency-Key` para que nunca se guarde dos veces.
- **Conflictos: gana lo último.** Cada cambio lleva la hora en que la persona lo hizo; si el mismo dato cambió en dos lugares, queda el más reciente. **Las reglas del negocio se validan siempre** (por ejemplo, el kilometraje nunca baja aunque el último cambio lo intente).
- **Al cerrar sesión** se borra la base local.
- Sin red **no funcionan** el Mecánico IA ni la búsqueda en el catálogo (las marcas ya buscadas quedan en caché).

## Alternativas consideradas

- **Solo caché en memoria de TanStack Query:** se pierde al cerrar la app.
- **Base local con sincronización automática de terceros** (WatermelonDB, PowerSync): más poder, pero otra dependencia y otra forma de modelar.
- **"Gana el servidor" o preguntar a la persona:** más seguro ante conflictos, pero menos fluido; el equipo eligió "gana lo último" con validación de reglas.

## Consecuencias

- Una segunda base de datos que mantener (esquema local con sus migraciones).
- El backend debe aceptar `Idempotency-Key` y la hora del cambio en las escrituras.
- "Gana lo último" puede descartar un cambio hecho antes en otro celular; es aceptable porque la persona suele usar un solo celular.

## Enmienda (2026-10-22): cómo se construyó

- **El último estado y la cola los guarda TanStack Query** (`@tanstack/react-query-persist-client` con `query-async-storage-persister`) en el almacén clave-valor de SQLite (`expo-sqlite/kv-store`), en vez de tablas propias con su sincronizador. En la demo web se usa `localStorage`: SQLite en el navegador pide cabeceras que la demo no tiene. Código en `mobile/src/shared/sinRed`.
- Se guardan las consultas marcadas con `meta: { guardarSinRed: true }` (vehículos, cuenta y búsquedas del catálogo; cada etapa nueva marca las suyas) y los cambios que esperan red. Lo guardado dura hasta 30 días.
- **Por ahora, solo el kilometraje se anota sin red** (RF-GAR-06). Editar o registrar sin red falla de una vez con "Revisa tu internet": la edición usa la versión de fila del vehículo, y volverla "gana lo último" queda para cuando haga falta.
- **"Gana lo último" en el kilometraje:** el cambio lleva `leidoEn`, el día en que se anotó. Si ya hay una lectura de un día posterior, o una igual o mayor, se descarta sin error. El kilometraje nunca baja.
- **`Idempotency-Key`:** filtro del backend después de Spring Security, con la tabla `cambio_procesado` (V10). Guarda solo respuestas 2xx durante 7 días y responde lo mismo, con `Idempotent-Replayed: true`, si la clave se repite.
- Al cerrar sesión o eliminar la cuenta se borra lo guardado en el celular.
