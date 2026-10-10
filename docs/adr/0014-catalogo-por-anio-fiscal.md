# ADR 0014 — Catálogo de vehículos vivo por año fiscal

- **Estado:** aceptada
- **Fecha:** 2026-10-10
- **Autores:** Isaac Cano, Pablo Rodríguez

## Contexto

El catálogo se cargó una vez con las tablas de base gravable 2025 del Ministerio de Transporte (508 marcas, 11.583 líneas). El Ministerio publica tablas nuevas cada año. WEVEH necesita un catálogo que se actualice año a año sin romper los vehículos ya registrados y que se enriquezca con lo que aprende.

## Decisión

- **Versionado por año fiscal:** cada línea guarda en qué años fiscales apareció y su avalúo por año. Al cargar un año nuevo se **actualizan y agregan** líneas, **nunca se borran**; los vehículos registrados siguen apuntando a su línea (y además guardan marca, línea y cilindrada como texto).
- **La importación es un proceso del backend**, repetible: se ejecuta con un comando, sabe si un año ya se cargó, corre en una transacción y deja un reporte (líneas nuevas, cambiadas, marcas parecidas para revisar).
- **Archivos:** los Excel van en `datos/mintransporte/<año>/` y la salida en `datos/catalogo/<año>/`; `datos/` está en `.gitignore`.
- **El catálogo se enriquece con el uso:** las fichas técnicas del agente perfilador quedan ligadas a la línea, y los vehículos escritos a mano ("Lo revisaremos") quedan en una lista para incorporarlos.
- Revisar si el Ministerio publica las tablas en **datos.gov.co** en formato abierto para automatizar la descarga.

## Alternativas consideradas

- **Cargar cada año en tablas nuevas o con `truncate`:** pierde la historia y obliga a reasignar vehículos.
- **Un catálogo comercial de pago:** más datos técnicos, pero con costo.

## Consecuencias

- Migración para agregar los años fiscales por línea y una tabla de importaciones.
- Sin rol administrador (ADR 0005), la revisión de "Lo revisaremos" y de marcas parecidas se hace con scripts.
