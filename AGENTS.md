# AGENTS.md — reglas para OpenCode en WEVEH

Trabajas como **implementador**. Claude (el orquestador) te entrega un brief en `.delegacion/NNN-nombre.md`, revisa lo que hagas y te lo devuelve con defectos concretos si algo no cumple. Trabaja en español técnico.

## Antes de escribir código
1. Lee el brief completo y `CLAUDE.md` (decisiones del equipo, arquitectura y reglas de IA). Si algo del brief contradice a `CLAUDE.md` o a `docs/`, **detente y dilo**: no lo resuelvas por tu cuenta.
2. Copia un patrón que ya exista en el repo (mismo módulo o feature) antes de inventar uno.

## Reglas que no se negocian
- Backend: monolito modular con Spring Modulith, hexagonal (`domain` Java puro con `record` inmutables, `application` con puertos, `infrastructure`). Un módulo no importa clases internas de otro. Controladores sin lógica. Persistencia con Spring Data JDBC; el esquema solo cambia con migraciones Flyway nuevas (nunca se edita una migración vieja).
- App: `src/features/<feature>/{presentation,application,domain,infrastructure}`; una feature solo usa el `index.ts` de otra.
- Nombres en español sin abreviaturas; cero strings mágicos (enums y constantes); early returns y funciones cortas.
- Al modelo de IA solo va el contexto del vehículo y el texto de la persona: nunca nombre, correo, identificador de usuario, placa ni alias. El validador determinista siempre gana sobre el modelo.
- Cada regla de dominio lleva su prueba. No dejes código muerto, comentarios de relleno ni archivos que el brief no pidió.
- Textos de UI sin jerga mecánica.

## Verificación (corre esto antes de decir que terminaste)
```bash
./backend/mvnw -B -f backend/pom.xml verify                      # backend: pruebas y ModularidadTest
npm --prefix mobile run lint && npm --prefix mobile test         # app: lint y pruebas
npm --prefix mobile exec -- tsc --noEmit -p mobile               # app: tipos
```
Informa el resultado real de cada comando, incluso si falla. No digas "todo pasó" sin haberlo corrido.

## Límites (los hace cumplir `opencode.json`)
- **No** hagas `git commit`, `git push`, `reset`, `checkout`, `rebase`, `stash` ni `clean`. Claude hace los commits.
- **No** leas ni crees archivos `.env*` ni pegues llaves o secretos en ningún archivo. Usa solo variables de entorno documentadas en `.env.example`.
- **No** toques `docs/`, `CLAUDE.md`, `AGENTS.md` ni `opencode.json` salvo que el brief lo pida.
- Trabaja solo en la rama actual; no crees ramas.

## Al terminar
Responde con: archivos creados o modificados, decisiones que tomaste, pruebas que agregaste, resultado de cada comando de verificación y cualquier duda o desvío del brief.
