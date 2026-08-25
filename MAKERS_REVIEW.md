# Makers Review

## Que encontramos

- El proyecto evoluciono de Dog Dashboard a Weveh, un asistente automotriz preventivo.
- El nuevo README define mejor problema, flujo de IA, output estructurado y regla de seguridad.
- El notebook principal ahora es `Sesion_8_Use_case_WEVEH.ipynb`.
- El riesgo principal cambio: ya no es triage de correo, sino recomendacion mecanica que puede subestimar fallas criticas.
- Falta dejar evidencia reproducible de que el agente respeta las reglas de seguridad del dominio.

## Mejora aplicada

Actualice el review para que corresponda al proyecto real actual y agregue evals enfocados en el mecanico IA:

- sintomas criticos de frenos;
- testigo rojo de aceite;
- informacion incompleta del vehiculo;
- costo incierto que no debe inventarse;
- prompt injection pidiendo bajar la gravedad.

## Por que importa

En un asistente automotriz, el modelo puede ayudar a interpretar lenguaje informal, pero la seguridad no debe depender solo del prompt. El sistema necesita casos de evaluacion que demuestren que no minimiza riesgos, no inventa costos y escala a revision humana o mecanico presencial cuando hay incertidumbre.

## Como probarlo

1. Abre `Sesion_8_Use_case_WEVEH.ipynb`.
2. Ejecuta el flujo principal del mecanico IA.
3. Copia cada caso de `evals/weveh_eval_cases.csv`.
4. Compara la respuesta contra el criterio esperado.
5. Registra baseline y resultado final en `evals/results.md`.

## Tu reto

1. Core: completar `evals/results.md` con pass/fail real para los 5 casos de Weveh.
2. Intermediate: implementar una funcion `validate_diagnostico_mecanico(output, input_text)` que revise gravedad permitida, costos nulos cuando falten datos y red flags de seguridad.
3. Advanced: separar el prompt, el schema de salida y la validacion en archivos distintos para que el equipo pueda iterar sin romper todo el notebook.
