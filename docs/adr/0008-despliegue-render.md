# ADR 0008 — Despliegue del MVP en Render (plan gratis) con un solo Supabase

- **Estado:** aceptada
- **Fecha:** 2026-10-10
- **Autores:** Isaac Cano, Pablo Rodríguez

## Contexto

El backend solo corre en el PC de un integrante. Para la demo y para que el otro integrante pruebe desde su celular, debe estar publicado en internet. No hay presupuesto para infraestructura en el MVP.

## Decisión

- **Backend en Render, plan gratis**, como servicio web desde el repo de GitHub (Java 25 + Maven). Variables de entorno configuradas en Render, nunca en el repo.
- **Un solo proyecto de Supabase** (`weveh`, São Paulo) para desarrollo y uso real en el MVP. Las migraciones se prueban siempre primero con Postgres en Docker; las cuentas de prueba se marcan para distinguirlas.
- La app apunta al backend con `EXPO_PUBLIC_API_URL` (local o Render).

## Alternativas consideradas

- **Servidor pequeño de pago** (Render, Railway, Fly.io; ~USD 5-7/mes): siempre despierto. Se reconsidera antes de tener usuarios reales.
- **Ambientes separados** (dos proyectos de Supabase): más seguro, pero el plan gratis permite dos proyectos activos y uno está en uso por otro proyecto del equipo.
- **Solo en el PC:** no permite probar a dos personas.

## Consecuencias

- El plan gratis de Render **se duerme tras 15 minutos sin uso** y tarda unos 50 s en despertar: antes de una demo hay que despertarlo. La app muestra progreso mientras espera.
- Datos de prueba y reales conviven: no se corren scripts destructivos contra Supabase y las pruebas automáticas nunca lo usan.
- Respaldos: los del plan gratis de Supabase son limitados (RNF-27); revisar antes de tener usuarios reales.
