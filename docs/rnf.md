# Requisitos no funcionales

Organizados por las características de calidad de ISO/IEC 25010. Cada uno es medible y dice cómo se verifica.

**Estados:** ✅ se cumple y se verifica · ⚠️ no medido aún · ❌ no se cumple o no construido · 🔜 fase futura. Revisado el 2026-10-10; RNF-31 a 37 agregados el 2026-10-21 (ampliación aprobada).

## Eficiencia de desempeño

| ID | Requisito | Cómo se verifica | Estado |
|---|---|---|---|
| RNF-01 | p95 de los endpoints sin IA < 300 ms con la base en Supabase São Paulo | Prueba de carga corta (k6) antes de la demo; métricas de Actuator | ⚠️ |
| RNF-02 | Respuesta del Mecánico IA. **Meta temporal mientras se usen modelos gratuitos (ADR 0004): 45 s como máximo**, con mensajes de progreso que cambian. **Meta de producto: < 20 s en el 95 % de las consultas** | Tiempos guardados por consulta; evaluador por modelo | 🟡 temporal cumplido (27 s medidos); meta de producto ❌ |
| RNF-03 | Cada turno de la entrevista < 10 s; investigación de un modelo nuevo < 90 s con progreso visible; cada bloque de preguntas se puede dejar para después y retomar | Tiempos por sesión | 🔜 |
| RNF-31 | La transcripción de un audio de hasta 30 s tarda menos de 10 s en el 95 % de los casos, con el texto visible para corregirlo antes de enviar (RF-MIA-11) | Tiempos guardados por transcripción | 🔜 |

## Fiabilidad y disponibilidad

| ID | Requisito | Cómo se verifica | Estado |
|---|---|---|---|
| RNF-04 | Sin red, la app muestra el **último estado de todo** (vehículos, plan, documentos, historial, conversaciones) con "actualizado hace X" | Prueba manual en modo avión; pruebas de la capa SQLite | 🟡 vehículos, cuenta y catálogo (`sinRed.test.tsx`, `useVehiculos.test.tsx`); el plan, los documentos y las conversaciones se suman al construirlos; falta la prueba en modo avión |
| RNF-05 | Lo escrito sin red se envía una sola vez al volver la conexión (`Idempotency-Key`) | Prueba de integración de la cola | ✅ `CambiosSinRedIntegracionTest` (Postgres) y `useVehiculos.test.tsx`; falta la prueba en modo avión |
| RNF-20 | Si OpenRouter falla, el resto de la app sigue funcionando; con el cortacircuitos abierto, la respuesta segura llega en < 2 s | Prueba con el proveedor simulado caído | ❌ |
| RNF-21 | Un módulo se puede apagar con una variable sin afectar a los demás (responde 503 y la app desactiva la función) | Prueba de integración por módulo | ❌ |
| RNF-27 | Supabase tiene respaldo diario y está probado cómo restaurarlo | Ensayo de restauración documentado | ⚠️ |
| RNF-32 | Los avisos locales se reprograman cada vez que se abre la app y solo se programan los más próximos (máximo 20 pendientes) para respetar el tope del sistema; si el permiso está negado, la app lo dice (RF-MAN-09, RF-DOC-04) | Prueba manual en Android e iOS con el permiso concedido y negado | 🔜 |

## Seguridad y privacidad

| ID | Requisito | Cómo se verifica | Estado |
|---|---|---|---|
| RNF-06 | Cero secretos en el binario de la app y en el repo; configuración solo por variables de entorno | Job `higiene` de la CI; revisión del bundle | ✅ |
| RNF-07 | RLS activado en el 100 % de las tablas, sin políticas para `anon` ni `authenticated` | Advisors de Supabase en cada migración | ✅ |
| RNF-08 | Al modelo de IA no llega nombre, correo, identificador de usuario, placa, alias, fotos ni audio | Prueba unitaria del armado del contexto + regla de arquitectura | ✅ placa, alias e identificador en `ConsultarMecanicoServicioTest`; nombre y correo: `mecanicoia` no puede depender de `cuentas` (`ModularidadTest`) |
| RNF-09 | **Cada modelo de la lista** saca Crítico con `requires_mechanic` en el 100 % de los casos críticos de `evals/`; el que falle sale de la lista | Evaluador por modelo | 🟡 el primero 7/7; los demás sin evaluar |
| RNF-10 | Un recurso de **otro usuario** responde 404 | Prueba de integración por endpoint | ✅ |
| RNF-24 | La sesión usa un token firmado que expira; un token ausente, vencido o alterado responde 401 | Prueba de integración | ✅ |
| RNF-25 | Eliminar la cuenta o cambiar el correo piden volver a confirmar la identidad | Prueba de la app | ✅ `gestionCuenta.test.tsx`, `PantallasMisDatos.test.tsx`; el backend exige sesión de máximo 5 min |
| RNF-26 | Al eliminar la cuenta, todos sus datos se borran en < 24 h, incluido lo guardado en el celular | Prueba de integración + verificación en la base | ✅ `CuentaIntegracionTest` (se borra al instante) y `useEliminarCuenta` (cierra la sesión y limpia la caché); la base local de la etapa 4 también se borrará |
| RNF-23 | Los logs y el monitoreo nunca contienen nombre, correo, token ni llaves | Revisión de configuración de Sentry y logs | ⚠️ |
| RNF-33 | El audio se borra apenas se transcribe; las fotos pesan menos de 1 MB tras reducirlas, solo las ve su dueña o dueño, pasan siempre por la API, nunca llegan a un modelo y se borran con el vehículo o la cuenta en menos de 24 h (RF-DAT-09, ADR 0018) | Prueba de integración + verificación en el almacenamiento | 🔜 |
| RNF-35 | El plazo del diagnóstico (No manejar, hoy, esta semana, próximo servicio) lo fija código; en el 100 % de los casos críticos de `evals/` el plazo es "No manejes" u "hoy", sin importar lo que diga el modelo, y ninguna pregunta de mantenimiento sin síntoma recibe "No manejes" (RF-MIA-08) | Evaluador por modelo + vectores compartidos | 🔜 |

## Usabilidad

| ID | Requisito | Cómo se verifica | Estado |
|---|---|---|---|
| RNF-11 | Registro de un vehículo con datos mínimos en < 1 minuto por alguien que nunca usó la app | Prueba con 3 personas antes de la demo | ⚠️ |
| RNF-12 | Contraste de texto AA (4,5:1) en modo claro y oscuro | Revisión de los tokens del sistema de diseño | ⚠️ |
| RNF-13 | Objetivos táctiles ≥ 44 pt | Revisión de componentes | ✅ |
| RNF-14 | Textos de UI sin jerga mecánica | Revisión del PR | ✅ |
| RNF-34 | Todo estado calculado con un kilometraje confirmado hace más de 30 días lo dice en pantalla ("calculado con el km de hace X días"); nunca se muestra un kilometraje estimado como si fuera real (RF-GAR-05) | Revisión del PR + prueba de la pantalla | 🔜 |
| RNF-37 | Entre mantenimiento y documentos la app envía como máximo dos notificaciones por día, agrupadas, para que nadie las silencie (RF-MAN-09, RF-DOC-04) | Prueba del agrupador de avisos | 🔜 |

## Mantenibilidad y observabilidad

| ID | Requisito | Cómo se verifica | Estado |
|---|---|---|---|
| RNF-15 | Ningún módulo usa clases internas de otro | `ModularidadTest` en la CI; ESLint de fronteras en la app | ✅ |
| RNF-16 | Las reglas de dominio pasan los mismos vectores en Java y TypeScript | CI (JUnit + Jest sobre `contracts/`) | 🔜 fase 2 |
| RNF-17 | Cobertura de líneas ≥ 80 % en los paquetes `domain` del backend y de las features. La cobertura dice qué código ejecutaron las pruebas, no si revisan bien el resultado | JaCoCo (backend) y `jest --coverage` (app), medidos por SonarCloud (job `sonar` en la CI, `sonar-project.properties`); la CI falla si el Quality Gate no pasa | 🟡 CI lista, falta crear el proyecto en SonarCloud y el secreto `SONAR_TOKEN`, y fijar el umbral de 80 % en su Quality Gate |
| RNF-22 | `/actuator/health` muestra el estado de cada módulo y de sus dependencias (base de datos, OpenRouter, buscador) | Prueba de Actuator | ❌ |
| RNF-30 | Los errores del backend y de la app llegan a Sentry con aviso por correo | Error de prueba en cada despliegue | ❌ |

## Portabilidad

| ID | Requisito | Cómo se verifica | Estado |
|---|---|---|---|
| RNF-18 | La app funciona en Android 10+ e iOS 16+ (o los mínimos de Expo SDK 57) | Emulador de Android Studio con app propia; iPhone real | ❌ solo probado en el navegador |

## Costo

| ID | Requisito | Cómo se verifica | Estado |
|---|---|---|---|
| RNF-19 | El agente perfilador: máximo 3 sesiones nuevas por vehículo y por cuenta al día (retomar no cuenta); la búsqueda web se hace por intención y una vez por modelo mientras la ficha tenga menos de 180 días, con un presupuesto de búsquedas por sesión | Registro de búsquedas por sesión | 🔜 |
| RNF-28 | La IA cuesta $0: solo modelos `:free` | Configuración de `WEVEH_IA_MODELO` revisada en cada PR | ✅ |
| RNF-29 | La lista de modelos se evalúa uno por uno antes de cada entrega y se ordena por calidad, velocidad y estabilidad | `evals/results.md` actualizado | ❌ hoy se evalúa la cadena |
| RNF-36 | El buscador web y la transcripción operan dentro de su cupo gratuito; al 80 % del cupo mensual el equipo recibe un aviso y la app sigue funcionando con las fichas vigentes (RF-PER-10) | Contadores por proveedor revisados cada semana | 🔜 |
