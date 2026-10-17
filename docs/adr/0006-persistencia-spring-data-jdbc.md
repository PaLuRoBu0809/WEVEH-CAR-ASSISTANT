# ADR 0006 — Persistencia con Spring Data JDBC

- **Estado:** aceptada (reemplaza "Data JPA" en el ADR 0001)
- **Fecha:** 2026-10-10
- **Autores:** Isaac Cano, Pablo Rodríguez

## Contexto

El ADR 0001 instaló Spring Data JPA, pero la fase 1 se construyó con SQL directo (`JdbcClient`) y JPA quedó sin usar. Hay que elegir una sola forma de guardar datos para todo el backend, pensando en que WEVEH crece en módulos con mucho CRUD (mantenimiento, documentos, combustible, cuentas) y en que el dominio es inmutable (`record`) y está separado de la persistencia (ADR 0003).

Dos ideas que se revisaron y no aplican: los roles y permisos los maneja Spring Security, no la herramienta de persistencia; y con tablas grandes lo que importa es controlar las consultas (índices, paginación), no un ORM.

## Decisión

- **Spring Data JDBC en todo el backend.** Cada módulo tiene, en `infrastructure/persistencia/`, filas de persistencia (`record` con `@Table`) y un repositorio de Spring Data JDBC; el adaptador implementa el puerto de `application` y traduce fila ↔ dominio.
- **Concurrencia** con `@Version` (columna `version_fila`): una edición sobre una versión vieja falla y el caso de uso responde 409.
- **Consultas que no caben en un método derivado** se escriben con `@Query`. La búsqueda del catálogo, que arma el SQL según las palabras escritas, es un **fragmento personalizado** del repositorio (única excepción con SQL dinámico).
- **Columnas `jsonb`** se escriben con `@Query` y `cast(:valor as jsonb)`.
- **Se quitan** Spring Data JPA y el uso suelto de `JdbcClient` en los adaptadores.

## Alternativas consideradas

- **JPA (Hibernate):** menos código en CRUD y relaciones automáticas, pero exige clases mutables (doble clase por concepto con el dominio inmutable), tiene carga perezosa con riesgo de N+1 y guardados automáticos difíciles de depurar; y las funciones propias de Postgres (`pg_trgm`, `jsonb`) igual van en SQL nativo.
- **`JdbcClient` en todo:** control total y sin magia, pero cada insert, update y mapeo se escribe a mano, y la concurrencia y la auditoría también.

## Consecuencias

- Una sola tecnología de persistencia en el backend: más fácil de aprender, revisar y mantener.
- CRUD sin SQL (`findByDispositivoId`), `@Version` y, si hace falta, auditoría con anotaciones; sin carga perezosa ni guardados ocultos.
- Las relaciones se modelan por agregado (un vehículo y sus partes), no como grafos arbitrarios: si un módulo llegara a necesitar relaciones muy complejas, se puede cambiar su adaptador sin afectar a los demás, porque cada uno tiene su puerto.
- Los errores de nombres de columna solo aparecen al ejecutar: las pruebas de integración con Postgres en Docker son obligatorias para cada repositorio.
