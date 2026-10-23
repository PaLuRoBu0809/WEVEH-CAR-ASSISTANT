# Plan de construcción (tareas)

Tercera capa del SDD: **qué falta construir, en qué orden y cómo se verifica cada paso**. Cada tarea enlaza su requisito o ADR. Se marca `[x]` cuando su PR se fusiona con pruebas y CI en verde. Revisado el 2026-10-10. Reordenado el 2026-10-21 con la ampliación propuesta el 2026-10-19 y aprobada (ADR 0016 a 0021 aceptados).

## Hecho

- [x] **Fase 0 · Fundaciones:** repo, CI (higiene, backend, mobile), ADR del stack, esqueletos que compilan y prueban, Supabase, identidad por dispositivo de punta a punta (PR #4, #5, #6).
- [x] **Diseño de los mockups** en la app (PR #7).
- [x] **Fase 1 · parte A:** catálogo 2025 cargado (508 marcas, 11.583 líneas), búsqueda, registro de vehículos por pasos, eliminar, Mecánico IA de una pregunta con OpenRouter gratis, validador de seguridad, lista de modelos de respaldo, evals 7/7 (PR #8).

## Etapa 1 · Persistencia unificada (ADR 0006) ✅ 2026-10-15

- [x] Cambiar Spring Data JPA por Spring Data JDBC en el `pom.xml`.
- [x] Garaje: filas + repositorio + adaptador con `@Version`; mismas pruebas en verde.
- [x] Consultas del Mecánico IA: repositorio con `@Query` para `jsonb`.
- [x] Catálogo: repositorio con fragmento personalizado para la búsqueda dinámica.
- [x] Verificación: 84 pruebas en verde (las 82 de antes + 2 de integración nuevas: edición con `@Version` y consultas con `jsonb`), sin cambios en dominio ni API.

## Etapa 2 · Cuentas y tratamiento de datos (ADR 0005, RF-CTA, RF-DAT) ✅ 2026-10-22

- [x] Borrador de la política de tratamiento de datos ([v0.1](legal/politica-tratamiento-datos-BORRADOR.md)); el flujo de consentimiento registra la versión `0.1-borrador`.
- [x] Configurar Supabase Auth: correo con verificación, Google (credenciales en Google Cloud) y llave service_role en el backend. La dirección de retorno `weveh://` va con la parte 2 (el enlace mágico salió del MVP).
- [x] Backend: módulo `cuentas`, Spring Security con validación del token (JWKS), `usuario_id` en vez de `dispositivo_id`, 401/404, tablas `usuario` y `consentimiento`, `DELETE /cuenta`.
- [x] Migración que borra los vehículos de prueba y cambia la identidad (V5).
- [x] App (parte 1): portada con dos botones, crear cuenta e iniciar sesión con correo y contraseña, sesión en SecureStore, cerrar sesión, nombre y correo en Perfil.
- [x] App (parte 2a, [ADR 0022](adr/0022-enlaces-del-correo-a-la-demo-web.md)): "Continuar con Google" con PKCE y "Antes de entrar" (`medio = APP_GOOGLE`, V9), recuperar contraseña, "Revisa tu correo" y "Cuenta confirmada" en la demo web, leer la política desde la casilla. Plantillas en `docs/correos/`.
- [x] Configurar en Supabase (Pablo): Site URL y Redirect URLs, plantillas de `docs/correos/`, Email OTP expiration = 3600, "Confirm email" activo, SMTP de Brevo (usuario = el login SMTP `…@smtp-brevo.com`, clave `xsmtpsib-`), proveedor Google; V9 aplicada por Render.
- [x] App (parte 2b): Perfil → "Mis datos" (RF-DAT-04), cambiar nombre, correo (dos enlaces, `/correo-cambiado`) y contraseña (RF-CTA-07), confirmar la identidad (RF-CTA-05) y "Eliminar mi cuenta" (RF-DAT-06/07). El enlace mágico sale del MVP.
- [ ] Supabase (Pablo): plantilla "Change email address" con `docs/correos/cambiar-correo.html` (asunto "Confirma el cambio de correo en WEVEH").
- [x] Verificación: criterios de RF-CTA y RF-DAT con pruebas; RNF-08 (regla de arquitectura: `mecanicoia` no depende de `cuentas`), 10, 24, 25 y 26; probado en el emulador de Android con Expo Go (2026-10-22). El diseño del mockup en cuenta y la app propia con EAS pasan a "Antes de la demo".

## Etapa 3 · Registro mínimo y edición (RF-GAR-02, 02b, 03, 05) ✅ 2026-10-15

- [x] Backend: aceite, SOAT y RTM opcionales (V6), `datosFaltantes` y `PUT /vehiculos/{id}/registro`.
- [x] App: registro corto ("Lo agrego después"), recordatorio "Te faltan los papeles" en Inicio, guía paso a paso para revisar el aceite.
- [x] App: pantalla del vehículo (editar, completar datos, eliminar).
- [x] Kilometraje adelantado de la fase 2 (RF-GAR-05): nunca baja, confirma saltos raros (V7), evento `KilometrajeActualizado`. El recálculo del plan llega con mantenimiento.

## Etapa 3b · Atributos del catálogo (RF-CAT-04, RF-CAT-05, RF-GAR-02, RF-GAR-03; ADR 0016, ADR 0021)

- [x] Migración V8: ampliar el CHECK de `catalogo.linea.combustible` **y** de `vehiculo.combustible` a gasolina, diésel, gas, híbrido, híbrido enchufable y eléctrico; tabla `catalogo.atributo_linea` (`linea_id`, atributo, valores, origen `CATALOGO`/`IA_WEB`/`EQUIPO`, URL, cita, tipo de fuente, verificada, lote) con RLS.
- [x] Backend: `GAS` e `HIBRIDO_ENCHUFABLE` en el enum `Combustible`; la búsqueda de líneas devuelve cada atributo con sus valores y su origen (catálogo, luego web verificada); editar combustible, transmisión y tracción (`PUT /vehiculos/{id}`).
- [x] Capa 0 en el importador: "TP" = automática y las cajas con nombre propio (S-TRONIC, TIPTRONIC, DSG…), códigos de motor de gasolina y diésel (TFSI, CDI, "120D"…), tracciones comerciales (QUATTRO, 4MATIC…); motos no eléctricas que no son motocarro = gasolina. Pruebas con nombres reales y el falso positivo "A8 D4".
- [ ] Actualizar los atributos del catálogo en Supabase con un `UPDATE` por `id` (sin borrar ni recargar líneas, ADR 0014) y repetir la medición de cobertura. SQL listo en `datos/catalogo/2025/actualizar_atributos.sql` (esperado en carros: combustible 11,3 %, transmisión 62,6 %, tracción 15,0 %); se corre después de que Render despliegue V8.
- [x] App: no preguntar lo que viene del nombre; mostrar "Dato de WEVEH · según [fuente]" lo investigado; si hay varios valores, preguntar solo entre ellos; sin dato, preguntar con "No sé" sin nada marcado. Quitar el relleno de gasolina por defecto.
- [x] App: el uso sale del registro (queda "Mixto"); editar combustible, transmisión y tracción desde el vehículo; el plan se reconstruye cuando exista (RF-GAR-03).
- [x] Reporte de cobertura de atributos por tabla y por origen en cada importación, con la línea base del 2026-10-21 (carros: transmisión 51,1 %, tracción 11,8 %, combustible 3,6 %), y correcciones de las personas (RF-CAT-05).
- [x] Verificación: criterios de RF-CAT-04 y RF-CAT-05 con pruebas; `docs/api.md`, `docs/datos.md` y `contracts/openapi.yaml` al día.

## Etapa 3c · Enriquecimiento del catálogo por familia (ADR 0021, RF-CAT-05)

- [ ] Lista de las ~50 familias más vendidas en Colombia, con la URL de cada ranking, cruzada con las familias del catálogo.
- [ ] Piloto: por familia, una búsqueda en la web y respuesta por cilindraje (combustible, tracciones y transmisiones ofrecidas), cada dato con URL, cita, tipo de fuente y fecha; sin fuente aceptable queda vacío.
- [ ] Regla de aceptación: una fuente del fabricante o del concesionario, o dos independientes que coincidan; los foros nunca solos.
- [ ] Validador del lote: valores del enum, URL presente y que responde, cilindraje que existe en la familia, sin contradecir la capa 0; muestra al azar del 10 % para revisión del equipo.
- [ ] Carga en `catalogo.atributo_linea` con su `lote` (se puede deshacer por lote).
- [ ] Medir el piloto (precisión en la muestra, tiempo por familia, cobertura ganada) y anotarlo en el ADR 0021 para decidir el tamaño de los lotes siguientes.

## Etapa 4 · Sin red (ADR 0009, RF-GAR-01, RF-GAR-06, RF-CAT-01)

- [x] Último estado en SQLite (`expo-sqlite/kv-store`; `localStorage` en la demo web) con TanStack Query persistido: vehículos, cuenta y búsquedas del catálogo (`meta: { guardarSinRed: true }`). Sin red: "Sin conexión · actualizado hace X".
- [x] Cola: el kilometraje sin red queda en pausa, se guarda en el celular y se envía solo al volver la red con `Idempotency-Key` y `leidoEn`. Lo demás (editar, registrar) falla de una vez con "Revisa tu internet".
- [x] Backend: filtro `Idempotency-Key` con tabla `cambio_procesado` (V10); `leidoEn` en el kilometraje y "gana lo último" (una lectura vieja o menor se descarta sin error).
- [x] Borrado de lo guardado en el celular al cerrar sesión y al eliminar la cuenta.
- [x] Cancelar un kilometraje que espera red, y corregir la última lectura hacia abajo en sus primeros 7 días sin bajar de la anterior ([ADR 0023](adr/0023-corregir-la-ultima-lectura-del-kilometraje.md), tabla `lectura_kilometraje` V11).
- [ ] Verificación manual en el emulador con Expo Go: el aviso sin red ya se vio (2026-10-22); faltan el envío al volver la red, cancelar y corregir.
- [ ] Abrir la app desde cero sin red (RNF-04 completo): solo con la app compilada (EAS), porque Expo Go baja el código de Metro.
- [ ] Mejora: si un kilometraje enviado al volver la red pide confirmar un salto raro y la app se cerró entre tanto, hoy la pregunta no se vuelve a mostrar (la lectura no se guarda). Mostrarla al abrir el vehículo.

## Etapa 5 · Resiliencia y monitoreo (ADR 0010)

- [x] Interruptor por módulo (`WEVEH_MODULO_<NOMBRE>=inactivo`): 503 `modulo-inactivo` y "en mantenimiento" en la app (garaje, catálogo, Mecánico IA).
- [x] Cortacircuitos y compartimento para OpenRouter (núcleo de Resilience4j): 3 fallas → 60 s de respuesta segura al instante; máximo 10 consultas de IA a la vez → 503 `mucha-demanda` y "Hay mucha demanda" en la app.
- [x] Salud por módulo en Actuator (`modulos`, `openrouter`, base de datos), siempre UP.
- [x] Sentry en el backend y en la app sin datos personales (organización `weveh-group`); se activa con `SENTRY_DSN` y `EXPO_PUBLIC_SENTRY_DSN`.
- [x] Proyectos `weveh-app` y `weveh-backend` creados en Sentry; error de prueba de la app recibido en `desarrollo` (2026-10-23).
- [ ] Pablo: DSN del backend en `backend/.env` y Render, y DSN de la app en Vercel (`EXPO_PUBLIC_SENTRY_ENTORNO=produccion`); probar un error del backend.
- [x] JaCoCo y `jest --coverage` con SonarCloud en la CI (job `sonar`, `sonar-project.properties`) (RNF-17).
- [x] Proyecto en sonarcloud.io con `SONAR_TOKEN` y Quality Gate de 80 % (funcionando desde el PR #12).
- [x] Despliegue del backend en Render (ADR 0008) y web de demo en Vercel (ADR 0015). Pool de conexiones en 7 por backend (`WEVEH_DB_POOL`, nota del ADR 0008).
- [x] Contrato OpenAPI generado y vigilado en la CI (ADR 0012): `ContratoOpenApiTest` y `contracts/openapi.yaml`.
- [ ] Pablo: cambiar la rama de producción de Vercel de `dev/pablo` a `main`.

## Etapa 6 · Mecánico IA conversacional (ADR 0004, RF-MIA)

- [ ] Evaluador por modelo: evals contra cada modelo, filtro de críticos, ranking por calidad, velocidad y estabilidad, propuesta de lista en `evals/results.md`.
- [x] Prompt `mecanico-v2`: estructura de 3 pasos, sin precios, siempre en español; evals (`evals/results.md`, 2026-10-16). Pendiente: que pida datos en síntomas ambiguos.
- [ ] Botón "¿Cuánto podría costar?" (RF-MIA-01b).
- [ ] Conversación con memoria, compactación y orden para caché (RF-MIA-02).
- [ ] Balde de consultas por cuenta, anti-abuso, cobro justo y freno global; cupo en Perfil (RF-MIA-07).
- [ ] Aviso "No escribas datos personales" (RF-DAT-08).
- [ ] Acotar `ValidadorSeguridadDiagnostico`: "aceite", "fren*" y "volante" solos no bastan; exige un síntoma (testigo, presión, ruido, falla, humo, recalentamiento). Casos nuevos en `evals/` para preguntas de mantenimiento sin síntoma; correr evals (RF-MIA-03).
- [ ] Plazo y recomendación estrictos de la app (`NO_MANEJAR`, `HOY`, `ESTA_SEMANA`, `PROXIMO_SERVICIO`) con vectores compartidos y `ValidadorSeguridadDiagnostico`; cambia el esquema: correr `evals/` (RF-MIA-08, RNF-35).
- [ ] Contexto completo del vehículo para el agente, sin datos personales (RF-MIA-10).
- [ ] Botón "¿Tu mecánico te dijo otra cosa?" como información (RF-MIA-09).
- [ ] Puerto `Transcriptor` con Whisper de Groq, audio borrado al transcribir, permiso del micrófono y límite diario (RF-MIA-11, RF-DAT-09, ADR 0018, RNF-31, RNF-33, RNF-36).

## Etapa 7 · Fase 2: mantenimiento y documentos (RF-MAN, RF-DOC; el plan escucha `KilometrajeActualizado`)

### 7a · Base
- [ ] Eventos guardados de Spring Modulith (ADR 0007).
- [ ] Vectores compartidos en Java y TypeScript para estados (con `SIN_DATO_REVISAR_YA`), salud con cuatro bandas y plazo (RNF-16).

### 7b · Plan por perfil y en capas (RF-MAN-01, 02, 03, 07; ADR 0016)
- [ ] Tabla de plantillas por perfil (tipo, propulsión, transmisión, tracción) con intervalo en km y en meses; carga por script o migración.
- [ ] Módulo `mantenimiento`: plan al registrar, estado por km y meses, "Sin dato · revisar ya" para piezas de seguridad, salud solo con datos suficientes, cualquier documento vencido ⇒ Atención.
- [ ] Capas: ficha del modelo, condiciones de uso, banderas de historia y edición de la persona, cada pieza con su `origen`.
- [ ] Editar intervalos (RF-MAN-06).

### 7c · Servicios e historial (RF-MAN-04, 04b, 04c, 05, 11; ADR 0017)
- [ ] Tablas `servicio`, `servicio_item` y `concepto_mecanico`; kits rápidos; solo `CAMBIO` reinicia el intervalo.
- [ ] Historial con trabajos y filtro por pieza.
- [ ] El agente arma el servicio por texto o voz, con extracción validada por esquema y confirmación.
- [ ] Foto de la factura como evidencia en almacenamiento privado, sin que la lea ningún modelo (RNF-33).
- [ ] Concepto del mecánico con vigencia y precedencia sobre el intervalo.

### 7d · Documentos ampliados (RF-DOC-01 a 08)
- [ ] Módulo `documentos`: vencimientos, RTM que aún no aplica, estado.
- [ ] Extintor y kit de carretera, impuesto vehicular, licencia por cuenta y recordatorio de multas.

### 7e · Avisos locales (RF-DOC-04, RF-MAN-09, RF-GAR-07; ADR 0020)
- [ ] Notificaciones locales de vencimientos con insistencia por tipo, agrupadas, máximo 20 programadas y reprogramación al abrir la app (RNF-32, RNF-37).
- [ ] Recordatorio de kilometraje cada 15 días (7, 15 o 30 configurable) y "confirmado hace X días" (RF-GAR-05, RNF-34).
- [ ] Avisos de mantenimiento por tiempo (programados) y por kilómetros (al llegar una lectura nueva).
- [ ] Probar permisos y tope de notificaciones en Android 13+ e iOS reales.

### 7f · Tarjetas y revisiones rápidas (RF-MAN-08, 10; RF-MIA-01c, 05)
- [ ] Tarjetas "¿Cuándo fue lo último?" con chips de respuesta rápida.
- [ ] Revisiones rápidas (labrado, líquidos, luces) con umbrales (D-10).
- [ ] Acciones del diagnóstico: ficha de falla automática, "Ver en el plan", cierre al vincular el servicio y "Compartir con mi mecánico".

## Etapa 8 · Fase 4: completar perfil (ADR 0013, ADR 0019, RF-PER)

- [ ] Puerto `BuscadorWeb` con Brave Search API, checklist de puntos y lista de dominios configurable. Confirmar antes el cupo gratuito vigente de Brave (RNF-36).
- [ ] Descarga, limpieza y verificación de páginas; ficha técnica con fuentes; los atributos que encuentre van a `catalogo.atributo_linea` (ADR 0021).
- [ ] Intenciones de conocimiento con plantilla y dominios propios; iteración gobernada por código con presupuesto por sesión (RF-PER-01, RF-PER-10, ADR 0019).
- [ ] Entrevista por bloques (máximo 8 preguntas por bloque, D-09), según el propósito de la persona (RF-PER-01, 02).
- [ ] Historia, uso y entorno, y banderas que decide el código (RF-PER-06, 07, 08).
- [ ] Campañas y fallas conocidas, con revisión legal antes de publicar por marca (RF-PER-09, D-11).
- [ ] Conflictos: se conserva el dato de la persona (RF-PER-03, D-08) y "¿Esto pasa ahora?" (RF-PER-04).
- [ ] Confirmación y límites; las sesiones retomadas no cuentan (RF-PER-05).

## Etapa 9 · Fase 5: combustible (RF-COM)

- [ ] Tanqueadas, consumo por tanque lleno y comparación con la referencia del modelo.

## Etapa 10 · Catálogo por año fiscal (ADR 0014, RF-CAT-03)

- [ ] Años fiscales por línea, importación repetible con reporte, Excel en `datos/mintransporte/<año>/`.
- [ ] Revisar si datos.gov.co publica las tablas para automatizar la descarga.

## Antes de la demo

- [ ] Correr el evaluador por modelo y ajustar `WEVEH_IA_MODELO`.
- [ ] Confirmar en la consola de Groq y de Brave los cupos gratuitos vigentes.
- [ ] Despertar el backend de Render y probar a la hora de la demo.
- [ ] Prueba de registro con 3 personas (RNF-11) y en un celular real (RNF-18).
- [ ] Diseño completo del mockup en las pantallas de cuenta (trama de W que se enciende y dial que se llena).
- [ ] App propia (development build con EAS) para probar Google y el regreso por `weveh://` fuera de Expo Go (ADR 0011).

## Después del MVP

- [ ] Lectura automática de facturas y tableros con modelos de visión, con ADR propio, consentimiento y revisión de transferencia internacional.
- [ ] Push del servidor, si la medición de uso lo justifica.
- [ ] Política de tratamiento de datos final con asesoría legal: completar los `[POR DEFINIR]` del borrador, base legal de la transferencia internacional y plazos de conservación; publicarla y pedir la aceptación de la nueva versión (RF-DAT-03).
