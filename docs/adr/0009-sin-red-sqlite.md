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
