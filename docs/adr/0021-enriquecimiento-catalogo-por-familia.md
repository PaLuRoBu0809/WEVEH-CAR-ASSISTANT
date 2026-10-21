# ADR 0021 — Enriquecimiento del catálogo por familia, con fuentes

- **Estado:** aceptada (2026-10-21)
- **Fecha:** 2026-10-21
- **Autores:** Isaac Cano, Pablo Rodríguez

## Contexto

RF-CAT-04 pide no preguntar en el registro lo que el catálogo ya sabe del vehículo (combustible, transmisión y tracción), y el plan por perfil ([ADR 0016](0016-plan-en-capas-por-perfil.md)) depende de esos tres datos. Las tablas de base gravable del Ministerio de Transporte (1, 2, 3, 5 y 9) **no tienen columnas** de combustible, transmisión ni tracción: solo tipo, clase, marca, línea, cilindraje y capacidad. Todo se deduce del nombre de la línea.

Mediciones del 2026-10-21:

| | Combustible | Transmisión | Tracción |
|---|---|---|---|
| Carros, hoy en Supabase | 3,6 % | 51,1 % | 11,8 % |
| Motos, hoy en Supabase | 3,6 % | 39,4 % | 3,0 % |
| Carros, con reglas del nombre ampliadas | ~8,7 % | ~72,4 % | ~16,2 % |

- "TP" aparece en 1.023 líneas, nunca junto a AT ni MT y siempre con cajas automáticas o pilotadas (S-TRONIC, SELESPEED, STEPTRONIC): se toma como **automática**.
- Los códigos de motor delatan el combustible en pocas líneas (TFSI, TSI, "118I" → gasolina; CDI, TDCI, "120D" → diésel), pero la mayoría no dice nada ("CORSA GL 4P MT", "COBALT LT 4P AT").
- En motos la clase lo dice: MOTOCICLETA ELECTRICA y MOTOCARRO ELECTRICO son explícitas; una motocicleta no eléctrica es de gasolina; los MOTOCARRO pueden ser diésel (por ejemplo "CAMELLITO RE205 D").
- 7.741 líneas reales de carro se agrupan en **1.673 familias** (marca + modelo). Con marca + modelo + cilindraje hay 3.654 grupos y **solo uno** mezcla diésel y gasolina: el cilindraje separa el motor.
- Hoy la app rellena gasolina en silencio cuando el catálogo no trae el combustible.

## Decisión

**Capa 0 · Reglas deterministas, sin web** (importador, `origen = CATALOGO`):
- Códigos del nombre: TP y cajas con nombre propio → transmisión; códigos de motor de gasolina y diésel → combustible; tracciones comerciales (QUATTRO, 4MATIC, XDRIVE…) → tracción. Se excluyen falsos positivos conocidos (la generación "D4" del Audi A8 no es diésel).
- La clase: tabla 9 → híbrido; potencia en kW o clase eléctrica → eléctrico; motocicleta, ciclomotor o cuatrimoto no eléctrica → gasolina. Los motocarros no se deducen.

**Capa 1 · Investigación en la web por familia** (`origen = IA_WEB`, CLAUDE.md §8.5):
- **Unidad:** una investigación por familia (marca + modelo), con la respuesta **por cilindraje**: combustible, tracciones ofrecidas y transmisiones ofrecidas.
- **Regla de aceptación:** una fuente del fabricante o del concesionario, o dos fuentes independientes que coincidan. Los foros nunca cuentan solos. Sin fuente aceptable el dato queda vacío, nunca inventado.
- **Valores múltiples:** si un modelo y cilindraje se ofrece con varias opciones (4x2 y 4x4), se guardan todas y la app pregunta solo entre ellas.
- **Validación:** un script revisa que cada valor esté en el enum, que tenga URL que responda y cita, que el cilindraje exista en la familia y que no contradiga la capa 0 (la capa 0 gana: es el nombre oficial). El equipo revisa una muestra del 10 % de cada lote antes de cargarlo.
- **Prioridad:** primero las familias más vendidas en Colombia (rankings públicos de ventas y parque automotor, con su URL). Un **piloto de unas 50 familias** mide precisión, tiempo y cobertura antes de definir los lotes siguientes.
- **Quién investiga:** ahora, Claude Code por lotes como herramienta del equipo (no es parte del producto); después, el agente del backend ([ADR 0013](0013-busqueda-web-perfilador.md), [ADR 0019](0019-conocimiento-por-intencion.md)) completa a demanda lo que falte cuando alguien registre un modelo sin cubrir, en la misma tabla.

**Dónde se guarda:** tabla nueva `catalogo.atributo_linea` (`linea_id`, `atributo`, `valores text[]`, `origen`, `fuente_url`, `cita`, `tipo_fuente`, `verificada`, `revisado_en`, `lote`), con RLS y sin políticas, como todas. **No se sobrescriben** las columnas de `catalogo.linea`. La API de líneas expone el valor resuelto por atributo y su origen, con prioridad `CATALOGO` > `IA_WEB` verificada > sin dato.

**En la app (RF-CAT-04):** dato del catálogo → no se pregunta; dato de la web revisado → "Dato de WEVEH · según [fuente] · Corregir"; varios valores → pregunta solo entre ellos; sin dato → pregunta con "No sé". **Nunca se rellena en silencio.**

## Alternativas consideradas

- **Investigar cada línea en la web (~10.000):** decenas de miles de búsquedas, y las versiones colombianas casi nunca aparecen tal cual; alto riesgo de inventar. No es viable.
- **Solo a demanda, cuando alguien registra:** el menor trabajo, pero los primeros usuarios responderían preguntas que se pueden evitar. Se conserva como complemento (agente del backend).
- **Guardar en las columnas de `catalogo.linea`:** más simple, pero se pierde la fuente de cada dato y no hay forma de deshacer un lote malo.
- **Preseleccionar "lo más común" (gasolina, 4x2) para confirmar con un toque:** registro más rápido, pero propone un dato sin fuente. Descartada por el equipo.

## Consecuencias

- Migración V8: amplía las restricciones de combustible (catálogo y vehículo) y crea `catalogo.atributo_linea`.
- CLAUDE.md §8.5 se aplica también al catálogo: todo dato de la web lleva URL, cita y tipo de fuente, y entra como propuesta revisada.
- Cada lote cuesta tiempo de investigación y de revisión del equipo; el piloto lo mide y la precisión se anota en este ADR.
- Un lote malo se deshace con `delete ... where lote = ...` sin tocar el catálogo del Ministerio.
- La importación de un año fiscal nuevo ([ADR 0014](0014-catalogo-por-anio-fiscal.md)) recalcula la capa 0; la capa 1 sigue ligada a cada línea.
- El reporte de cobertura (RF-CAT-05) se mide por atributo, tabla y origen, con la línea base de este ADR.
