# Plan de construcción (tareas)

Tercera capa del SDD: **qué falta construir, en qué orden y cómo se verifica cada paso**. Cada tarea enlaza su requisito o ADR. Se marca `[x]` cuando su PR se fusiona con pruebas y CI en verde. Revisado el 2026-10-10.

## Hecho

- [x] **Fase 0 · Fundaciones:** repo, CI (higiene, backend, mobile), ADR del stack, esqueletos que compilan y prueban, Supabase, identidad por dispositivo de punta a punta (PR #4, #5, #6).
- [x] **Diseño de los mockups** en la app (PR #7).
- [x] **Fase 1 · parte A:** catálogo 2025 cargado (508 marcas, 11.583 líneas), búsqueda, registro de vehículos por pasos, eliminar, Mecánico IA de una pregunta con OpenRouter gratis, validador de seguridad, lista de modelos de respaldo, evals 7/7 (PR #8).

## Etapa 1 · Persistencia unificada (ADR 0006)

- [ ] Cambiar Spring Data JPA por Spring Data JDBC en el `pom.xml`.
- [ ] Garaje: filas + repositorio + adaptador con `@Version`; mismas pruebas en verde.
- [ ] Consultas del Mecánico IA: repositorio con `@Query` para `jsonb`.
- [ ] Catálogo: repositorio con fragmento personalizado para la búsqueda dinámica.
- [ ] Verificación: las pruebas actuales (82) y las de integración con Postgres pasan sin cambios en dominio ni API.

## Etapa 2 · Cuentas y tratamiento de datos (ADR 0005, RF-CTA, RF-DAT)

- [x] Borrador de la política de tratamiento de datos ([v0.1](legal/politica-tratamiento-datos-BORRADOR.md)); el flujo de consentimiento registra la versión `0.1-borrador`.
- [ ] Configurar Supabase Auth: correo con verificación, enlace mágico, Google (credenciales en Google Cloud).
- [ ] Backend: módulo `cuentas`, Spring Security con validación del token (JWKS), `usuario_id` en vez de `dispositivo_id`, 401/404, tablas `usuario` y `consentimiento`, `DELETE /cuenta`.
- [ ] Migración que borra los vehículos de prueba y cambia la identidad.
- [ ] App: pantallas del mockup (portada con dos botones, crear cuenta con la trama de W, iniciar sesión con el dial, Google, enlace mágico), sesión en SecureStore, cerrar sesión, Perfil con "Mis datos" y "Eliminar mi cuenta".
- [ ] App propia (development build con EAS) y emulador de Android Studio para probar Google y el enlace mágico (ADR 0011).
- [ ] Verificación: criterios de RF-CTA y RF-DAT con pruebas; RNF-08, 10, 24, 25, 26.

## Etapa 3 · Registro mínimo y edición (RF-GAR-02, 02b, 03)

- [ ] Backend: aceite, SOAT y RTM opcionales (migración: `registro_soat_fecha` admite nulo).
- [ ] App: registro corto (vehículo + km obligatorios, lo demás opcional), recordatorio "Te faltan los papeles" en Inicio, guía paso a paso para revisar el aceite.
- [ ] App: pantalla de edición del vehículo.

## Etapa 4 · Sin red (ADR 0009, RF-GAR-01, RF-GAR-06, RF-CAT-01)

- [ ] SQLite con el último estado y lectura primero desde el celular.
- [ ] Cola de cambios con `Idempotency-Key` y hora del cambio; backend con tabla `cambio_procesado` y "gana lo último" validando reglas.
- [ ] Borrado de la base local al cerrar sesión.
- [ ] Verificación: RNF-04 y RNF-05 en modo avión.

## Etapa 5 · Resiliencia y monitoreo (ADR 0010)

- [ ] Interruptor por módulo (`WEVEH_MODULO_<NOMBRE>`).
- [ ] Cortacircuitos y compartimento para OpenRouter (Resilience4j); "mucha demanda" en la app.
- [ ] Salud por módulo en Actuator.
- [ ] Sentry en backend y app, sin datos personales.
- [ ] JaCoCo y `jest --coverage` con mínimo de 80 % en `domain` en la CI (RNF-17).
- [ ] Despliegue en Render (ADR 0008) y contrato OpenAPI generado y vigilado en la CI (ADR 0012).

## Etapa 6 · Mecánico IA conversacional (ADR 0004, RF-MIA)

- [ ] Evaluador por modelo: evals contra cada modelo, filtro de críticos, ranking por calidad, velocidad y estabilidad, propuesta de lista en `evals/results.md`.
- [ ] Prompt `mecanico-v2`: estructura de 3 pasos, sin precios; evals.
- [ ] Botón "¿Cuánto podría costar?" (RF-MIA-01b).
- [ ] Conversación con memoria, compactación y orden para caché (RF-MIA-02).
- [ ] Balde de consultas por cuenta, anti-abuso, cobro justo y freno global; cupo en Perfil (RF-MIA-07).
- [ ] Aviso "No escribas datos personales" (RF-DAT-08).

## Etapa 7 · Fase 2: mantenimiento y documentos (RF-MAN, RF-DOC, RF-GAR-05)

- [ ] Eventos guardados de Spring Modulith (ADR 0007).
- [ ] Módulo `mantenimiento`: plan genérico al registrar, estado de piezas y salud (vectores compartidos en Java y TypeScript), historial, editar intervalos, salud solo con datos suficientes.
- [ ] Módulo `documentos`: vencimientos, RTM que aún no aplica, estado y avisos insistentes con notificaciones locales.
- [ ] Actualizar kilometraje.
- [ ] Acciones del diagnóstico: "Ver en el plan" y "Anotar en el historial" (RF-MIA-01c).

## Etapa 8 · Fase 4: completar perfil (ADR 0013, RF-PER)

- [ ] Puerto `BuscadorWeb` con Brave Search API, checklist de puntos y lista de dominios configurable.
- [ ] Descarga, limpieza y verificación de páginas; ficha técnica con fuentes.
- [ ] Entrevista, confirmación y límites.

## Etapa 9 · Fase 5: combustible (RF-COM)

- [ ] Tanqueadas, consumo por tanque lleno y comparación con la referencia del modelo.

## Etapa 10 · Catálogo por año fiscal (ADR 0014, RF-CAT-03)

- [ ] Años fiscales por línea, importación repetible con reporte, Excel en `datos/mintransporte/<año>/`.
- [ ] Revisar si datos.gov.co publica las tablas para automatizar la descarga.

## Antes de la demo

- [ ] Correr el evaluador por modelo y ajustar `WEVEH_IA_MODELO`.
- [ ] Despertar el backend de Render y probar a la hora de la demo.
- [ ] Prueba de registro con 3 personas (RNF-11) y en un celular real (RNF-18).

## Después del MVP

- [ ] Política de tratamiento de datos final con asesoría legal: completar los `[POR DEFINIR]` del borrador, base legal de la transferencia internacional y plazos de conservación; publicarla y pedir la aceptación de la nueva versión (RF-DAT-03).
