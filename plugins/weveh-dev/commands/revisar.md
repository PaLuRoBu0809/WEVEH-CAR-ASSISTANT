---
description: Revisa el diff actual contra las reglas de WEVEH usando el agente revisor
argument-hint: "[rama-base o ruta]"
---

Usa el subagente `revisor` de este plugin para revisar los cambios.

- Si $ARGUMENTS es una rama, revisa `git diff $ARGUMENTS...HEAD`.
- Si es una ruta, revisa solo esa ruta.
- Si está vacío, revisa los cambios sin confirmar más los commits que no están en la rama base del PR (por defecto `origin/main`).

Muestra el reporte del revisor tal como lo entrega. Al final, en una línea, di si recomiendas abrir o fusionar el PR.
