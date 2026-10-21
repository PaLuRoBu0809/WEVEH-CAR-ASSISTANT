# Documentación de WEVEH

WEVEH se construye con **SDD (Spec-Driven Development)**: primero se especifica, luego se planea y luego se construye. La especificación es la fuente de verdad; si el código y los documentos no coinciden, se corrige uno de los dos en el mismo PR.

## Las tres capas

| Capa | Pregunta | Dónde |
|---|---|---|
| **1. Especificación** | ¿Qué debe hacer WEVEH y qué tan bien? | [`requisitos/`](requisitos/README.md) (historias y criterios Dado/Cuando/Entonces) y [`rnf.md`](rnf.md) (calidad medible) |
| **2. Plan** | ¿Cómo se construye y por qué así? | [`adr/`](adr/) (decisiones), [`arquitectura.md`](arquitectura.md), [`datos.md`](datos.md), [`api.md`](api.md) y [`../contracts/`](../contracts/README.md) (contrato OpenAPI y vectores de reglas) |
| **3. Tareas** | ¿Qué falta, en qué orden y cómo se verifica? | [`tareas.md`](tareas.md) |

Otros: [`../evals/`](../evals/results.md) (cómo se mide la IA) y [`referencia/`](referencia/README-original.md) (el README original del curso con el problema y el contrato del Mecánico IA).

## Cómo se trabaja una funcionalidad

1. **Especificar:** escribir o ajustar el requisito con ID (`RF-XXX-NN`) y sus criterios; si hay una regla con cálculo, sus vectores en `contracts/`.
2. **Decidir:** si hay una decisión difícil de revertir, un ADR (contexto, decisión, alternativas, consecuencias). Un ADR no se borra: se reemplaza por otro.
3. **Planear:** actualizar `arquitectura.md`, `datos.md` y `api.md` si cambian.
4. **Tareas:** agregar los pasos a `tareas.md`.
5. **Construir:** rama corta, pruebas de cada criterio, PR que enlaza los IDs; al fusionar se marca la tarea y el estado del requisito.

## Verificación automática

Las reglas que una prueba no ve viven en [`../scripts/calidad/`](../scripts/calidad/) y corren en dos sitios:

| Dónde | Cuándo | Qué hace |
|---|---|---|
| Hook Stop de Claude Code (`.claude/hooks/compuerta.mjs`) | Al terminar cada cambio | Reglas sobre lo no commiteado + lint, typecheck y pruebas del área tocada (mobile o backend; el backend necesita Docker). Si falla, Claude lo corrige antes de terminar. |
| Hook de commit (`.claude/hooks/commit.mjs`) | Antes de `git commit` | Conventional Commits, archivos o llaves secretas y nada en `main` salvo `WEVEH_PERMITIR_MAIN=1`. |
| CI, job `higiene` | Push a `main` o `dev/**` y PR | `node scripts/calidad/revisar.mjs origin/main`: las mismas reglas sobre lo commiteado. |

Reglas: tabla nueva sin RLS, migración ya versionada editada, prompt o `WEVEH_IA_MODELO` cambiado sin `evals/results.md`, `domain` importando Spring/Jakarta/JDBC, llaves en el código y archivos `.env.*`/`.pem`. Avisos sin bloquear: código nuevo sin `tareas.md`, controlador sin `openapi.yaml`/`api.md`. Para añadir una regla de texto, edita `scripts/calidad/reglas.mjs`.

## Convención de estados

✅ hecho · 🟡 parcial · ⬜ decidido, por construir · 🔜 fase futura · 🔁 hecho pero cambia por una decisión nueva.

## Las skills del plugin no son documentación del producto

`plugins/weveh-dev/skills/` son instrucciones para Claude Code sobre cómo construir. Remiten a estos documentos; si una skill contradice a `docs/`, gana `docs/` y se corrige la skill.
