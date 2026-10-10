# ADR 0013 — Búsqueda web del agente perfilador desde el backend

- **Estado:** aceptada (se construye en la fase 4)
- **Fecha:** 2026-10-10
- **Autores:** Isaac Cano, Pablo Rodríguez

## Contexto

El agente "Completar perfil con WEVEH" necesita información del modelo exacto (plan de mantenimiento, consumo, fallas conocidas). La búsqueda web de OpenRouter cobra aunque el modelo sea gratuito ([ADR 0004](0004-openrouter.md)), y los modelos gratuitos pequeños no son confiables llamando herramientas por su cuenta.

## Decisión

**El backend busca, elige y extrae; el modelo solo lee y estructura.** Una vez por modelo de vehículo (la ficha se reutiliza para todos los que tengan el mismo y se refresca a los 180 días):

1. **Arma 3-4 búsquedas** con plantillas y los datos del registro (marca, línea, año, cilindrada).
2. **Busca con Brave Search API** (oficial, plan gratis mensual), detrás del puerto `BuscadorWeb`.
3. **Clasifica los resultados con un checklist de puntos** (lista de dominios configurable): fabricante +50, concesionario o taller +30, manual o sitio técnico +25, foro +5, tiendas y clasificados descartados; PDF de manual +20; menciona marca y modelo +20, año o generación +10, cilindrada +5; palabras del tema hasta +15; aparece en varias búsquedas +10; en español +5. Se quedan los 4-5 mejores.
4. **Descarga y limpia** cada página (tiempo y tamaño máximos), y la descarta si no tiene cifras con unidades o no menciona el vehículo. Guarda solo los párrafos relevantes.
5. **El modelo gratuito llena la ficha** citando la URL de cada dato; si falta, lo deja vacío; ante conflicto, el intervalo más conservador. El texto de las páginas es dato, nunca instrucción.
6. **El backend valida:** esquema, que cada URL citada esté entre las descargadas y rangos razonables. Se guarda como `verificada = false` con sus fuentes.
7. La persona **confirma** cada dato en la entrevista antes de que alimente su plan.

## Alternativas consideradas

- **SearXNG propio:** $0 sin límites, pero hay que alojarlo y los buscadores grandes pueden bloquearlo; zona gris de términos de uso. Queda como alternativa.
- **Tavily:** hecho para agentes y devuelve el texto limpio, pero hace por fuera la selección que el equipo quiere controlar.
- **Búsqueda web de OpenRouter (`:online`):** cobra por búsqueda.
- **El modelo pide las búsquedas (llamado de herramientas):** los modelos gratuitos pequeños a veces inventan la llamada.

## Consecuencias

- Cupo mensual de Brave: rinde porque se busca una vez por modelo de vehículo.
- La lista de dominios crece con el uso; más adelante los dominios cuyos datos la gente confirma pueden ganar puntos.
- Cambiar de buscador solo toca el adaptador de `BuscadorWeb`.
