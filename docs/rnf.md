# Requisitos no funcionales

Organizados por las características de calidad de ISO/IEC 25010. Cada uno es medible y dice cómo se verifica.

| ID | Característica | Requisito | Cómo se verifica |
|---|---|---|---|
| RNF-01 | Eficiencia de desempeño | p95 de los endpoints sin IA < 300 ms con la base en Supabase São Paulo | Prueba de carga corta (k6 o similar) antes de la demo; métricas de Actuator |
| RNF-02 | Eficiencia de desempeño | Diagnóstico del Mecánico IA < 20 s de punta a punta, con indicador de progreso desde el primer segundo | Tiempos registrados por consulta; prueba manual en celular |
| RNF-03 | Eficiencia de desempeño | Cada turno de la entrevista del perfilador < 10 s; la investigación de una ficha nueva < 90 s con progreso visible | Tiempos registrados por sesión |
| RNF-04 | Fiabilidad | La app abre y muestra el garaje, el plan y los documentos sin red, con los últimos datos guardados | Prueba manual en modo avión |
| RNF-05 | Fiabilidad | Una escritura sin red se encola y se envía una sola vez al volver la conexión (`Idempotency-Key`) | Prueba de integración de la cola |
| RNF-06 | Seguridad | 0 secretos en el binario de la app y en el repo; configuración solo por variables de entorno | Revisión del bundle; job `higiene` de la CI |
| RNF-07 | Seguridad | RLS activado en el 100 % de las tablas, sin políticas para `anon` ni `authenticated` | Consulta a `pg_tables` / advisors de Supabase en cada migración |
| RNF-08 | Seguridad | Al modelo de IA no llega placa, alias ni `dispositivoId` | Prueba unitaria del armado de contexto |
| RNF-09 | Seguridad | El 100 % de los casos críticos de `evals/` sale `Crítico` con `requires_mechanic` | Runner de evals; un PR que baje este número no se fusiona |
| RNF-10 | Seguridad | Un recurso de otro dispositivo responde 404 | Prueba de integración por endpoint |
| RNF-11 | Usabilidad | Registro básico completo en < 2 minutos por una persona que nunca usó la app | Prueba con 3 personas antes de la demo |
| RNF-12 | Usabilidad | Contraste de texto AA (4,5:1) en modo claro y oscuro | Revisión de los tokens del sistema de diseño |
| RNF-13 | Usabilidad | Objetivos táctiles ≥ 44 pt | Revisión de componentes |
| RNF-14 | Usabilidad | Textos de UI sin jerga mecánica | Revisión del PR con la guía de la skill `feature-movil` |
| RNF-15 | Mantenibilidad | `ModularidadTest` en verde: ningún módulo usa clases internas de otro | CI |
| RNF-16 | Mantenibilidad | Las reglas de dominio pasan los mismos vectores en Java y TypeScript | CI (JUnit + Jest sobre `contracts/`) |
| RNF-17 | Mantenibilidad | Cobertura de líneas ≥ 80 % en los paquetes `domain` del backend y `domain` de las features | Reporte de JaCoCo y Jest |
| RNF-18 | Portabilidad | La app funciona en Android 10+ e iOS 16+ (o los mínimos que imponga Expo SDK 57) | Prueba en Expo Go o simulador |
| RNF-19 | Costo | Cada vehículo usa como máximo 3 sesiones de perfilamiento al día; la búsqueda web se paga una vez por modelo | Registro de tokens y búsquedas por sesión |
