# Requisitos no funcionales

Organizados por las características de calidad de ISO/IEC 25010. Cada uno es medible y dice cómo se verifica.

**Estados:** ✅ se cumple y se verifica · ⚠️ no medido aún · ❌ no se cumple o no construido · 🔜 fase futura. Revisado el 2026-10-10.

## Eficiencia de desempeño

| ID | Requisito | Cómo se verifica | Estado |
|---|---|---|---|
| RNF-01 | p95 de los endpoints sin IA < 300 ms con la base en Supabase São Paulo | Prueba de carga corta (k6) antes de la demo; métricas de Actuator | ⚠️ |
| RNF-02 | Respuesta del Mecánico IA. **Meta temporal mientras se usen modelos gratuitos (ADR 0004): 45 s como máximo**, con mensajes de progreso que cambian. **Meta de producto: < 20 s en el 95 % de las consultas** | Tiempos guardados por consulta; evaluador por modelo | 🟡 temporal cumplido (27 s medidos); meta de producto ❌ |
| RNF-03 | Cada turno de la entrevista < 10 s; investigación de un modelo nuevo < 90 s con progreso visible | Tiempos por sesión | 🔜 |

## Fiabilidad y disponibilidad

| ID | Requisito | Cómo se verifica | Estado |
|---|---|---|---|
| RNF-04 | Sin red, la app muestra el **último estado de todo** (vehículos, plan, documentos, historial, conversaciones) con "actualizado hace X" | Prueba manual en modo avión; pruebas de la capa SQLite | ❌ |
| RNF-05 | Lo escrito sin red se envía una sola vez al volver la conexión (`Idempotency-Key`) | Prueba de integración de la cola | ❌ |
| RNF-20 | Si OpenRouter falla, el resto de la app sigue funcionando; con el cortacircuitos abierto, la respuesta segura llega en < 2 s | Prueba con el proveedor simulado caído | ❌ |
| RNF-21 | Un módulo se puede apagar con una variable sin afectar a los demás (responde 503 y la app desactiva la función) | Prueba de integración por módulo | ❌ |
| RNF-27 | Supabase tiene respaldo diario y está probado cómo restaurarlo | Ensayo de restauración documentado | ⚠️ |

## Seguridad y privacidad

| ID | Requisito | Cómo se verifica | Estado |
|---|---|---|---|
| RNF-06 | Cero secretos en el binario de la app y en el repo; configuración solo por variables de entorno | Job `higiene` de la CI; revisión del bundle | ✅ |
| RNF-07 | RLS activado en el 100 % de las tablas, sin políticas para `anon` ni `authenticated` | Advisors de Supabase en cada migración | ✅ |
| RNF-08 | Al modelo de IA no llega nombre, correo, identificador de usuario, placa ni alias | Prueba unitaria del armado del contexto | 🟡 placa, alias e identificador ✅; nombre y correo cuando existan cuentas |
| RNF-09 | **Cada modelo de la lista** saca Crítico con `requires_mechanic` en el 100 % de los casos críticos de `evals/`; el que falle sale de la lista | Evaluador por modelo | 🟡 el primero 7/7; los demás sin evaluar |
| RNF-10 | Un recurso de **otro usuario** responde 404 | Prueba de integración por endpoint | 🔁 hoy por dispositivo |
| RNF-24 | La sesión usa un token firmado que expira; un token ausente, vencido o alterado responde 401 | Prueba de integración | ❌ |
| RNF-25 | Eliminar la cuenta o cambiar el correo piden volver a confirmar la identidad | Prueba de la app | ❌ |
| RNF-26 | Al eliminar la cuenta, todos sus datos se borran en < 24 h, incluido lo guardado en el celular | Prueba de integración + verificación en la base | ❌ |
| RNF-23 | Los logs y el monitoreo nunca contienen nombre, correo, token ni llaves | Revisión de configuración de Sentry y logs | ⚠️ |

## Usabilidad

| ID | Requisito | Cómo se verifica | Estado |
|---|---|---|---|
| RNF-11 | Registro de un vehículo con datos mínimos en < 1 minuto por alguien que nunca usó la app | Prueba con 3 personas antes de la demo | ⚠️ |
| RNF-12 | Contraste de texto AA (4,5:1) en modo claro y oscuro | Revisión de los tokens del sistema de diseño | ⚠️ |
| RNF-13 | Objetivos táctiles ≥ 44 pt | Revisión de componentes | ✅ |
| RNF-14 | Textos de UI sin jerga mecánica | Revisión del PR | ✅ |

## Mantenibilidad y observabilidad

| ID | Requisito | Cómo se verifica | Estado |
|---|---|---|---|
| RNF-15 | Ningún módulo usa clases internas de otro | `ModularidadTest` en la CI; ESLint de fronteras en la app | ✅ |
| RNF-16 | Las reglas de dominio pasan los mismos vectores en Java y TypeScript | CI (JUnit + Jest sobre `contracts/`) | 🔜 fase 2 |
| RNF-17 | Cobertura de líneas ≥ 80 % en los paquetes `domain` del backend y de las features. La cobertura dice qué código ejecutaron las pruebas, no si revisan bien el resultado | JaCoCo (backend) y `jest --coverage` (app); la CI falla si baja | ⚠️ |
| RNF-22 | `/actuator/health` muestra el estado de cada módulo y de sus dependencias (base de datos, OpenRouter, buscador) | Prueba de Actuator | ❌ |
| RNF-30 | Los errores del backend y de la app llegan a Sentry con aviso por correo | Error de prueba en cada despliegue | ❌ |

## Portabilidad

| ID | Requisito | Cómo se verifica | Estado |
|---|---|---|---|
| RNF-18 | La app funciona en Android 10+ e iOS 16+ (o los mínimos de Expo SDK 57) | Emulador de Android Studio con app propia; iPhone real | ❌ solo probado en el navegador |

## Costo

| ID | Requisito | Cómo se verifica | Estado |
|---|---|---|---|
| RNF-19 | El agente perfilador: máximo 3 sesiones por vehículo y por cuenta al día; la búsqueda web se hace una vez por modelo de vehículo | Registro de búsquedas por sesión | 🔜 |
| RNF-28 | La IA cuesta $0: solo modelos `:free` | Configuración de `WEVEH_IA_MODELO` revisada en cada PR | ✅ |
| RNF-29 | La lista de modelos se evalúa uno por uno antes de cada entrega y se ordena por calidad, velocidad y estabilidad | `evals/results.md` actualizado | ❌ hoy se evalúa la cadena |
