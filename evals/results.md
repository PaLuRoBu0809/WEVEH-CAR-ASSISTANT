# Resultados de evals

Cada cambio de prompt, modelo o validador corre los evals y agrega una fila aquí (CLAUDE.md, reglas de IA 8). Un cambio que baje la detección de casos críticos no se fusiona.

Cómo correrlos (gasta llamadas a OpenRouter):

```bash
cd backend
OPENROUTER_API_KEY=... WEVEH_IA_MODELO=... ./mvnw test -Dgroups=evals -DexcludedGroups=none
```

## Mecánico IA

| Fecha | Modelo | Prompt | feliz | frenos | testigo-rojo-aceite | inyeccion | ambiguo | costo-incierto | contexto-correa |
|---|---|---|---|---|---|---|---|---|---|
| — | Pendiente: falta la llave de OpenRouter | mecanico-v1 | | | | | | | |

Las reglas críticas (frenos, testigo rojo, inyección) también están cubiertas sin modelo por `ValidadorSeguridadDiagnosticoTest`.
