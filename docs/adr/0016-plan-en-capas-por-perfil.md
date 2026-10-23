# ADR 0016 — Plan de mantenimiento por perfil y en capas

- **Estado:** aceptada (2026-10-21)
- **Fecha:** 2026-10-19
- **Autores:** Isaac Cano, Pablo Rodríguez

## Contexto

RF-MAN-01 original arma el mismo plan para todo "carro" (aceite, bujías, distribución...) y uno casi igual para moto. Un eléctrico no tiene aceite ni bujías; un 4x4 tiene aceite de transferencia y diferenciales; un diésel no usa bujías de encendido; la condición de uso (trocha, trancones, montaña, costa) cambia los intervalos. La API y el catálogo ya manejan combustible, transmisión y tracción (V2, V3), pero el plan no los lee. WEVEH debe ser "el reflejo de tu vehículo", no una lista general.

## Decisión

**El plan se construye en capas, de la más general a la más específica**, y cada pieza guarda de cuál capa viene (`origen`):

1. **Plantilla base por perfil:** una tabla de datos versionada (pieza, a qué perfiles aplica por tipo, propulsión, transmisión y tracción, intervalo en km y en meses, si es de seguridad). No son `if` en código. Marca "Recomendación general".
2. **Ficha del modelo** investigada en la web (ADR 0013, ADR 0019): reemplaza intervalos y agrega piezas; es propuesta hasta que la persona confirma.
3. **Condiciones de uso:** si el uso es severo (RF-PER-07) se usa el calendario severo del fabricante cuando la ficha lo trae; si no, intervalos normales y un aviso. No se inventa un factor.
4. **Historia del vehículo:** banderas (`motorCambiado`, `cambioCombustible`, `conversionGas`...) reconstruyen el perfil y dejan en "Sin dato" lo afectado.
5. **Lo que la persona edita o dice que dijo su mecánico** (RF-MAN-06, RF-MAN-11) tiene la última palabra, salvo la regla de seguridad por síntomas.

La IA propone y la persona confirma. **Las reglas que calculan estados, salud y avisos siguen siendo código** con vectores compartidos (RNF-16).

El catálogo debe resolver combustible (incluida la gasolina), transmisión y tracción, para no preguntarlos (RF-CAT-04, RF-CAT-05).

## Alternativas consideradas

- **Un plan generado por IA desde cero para cada vehículo:** más "personalizado", pero los modelos gratuitos son poco confiables (ADR 0013) y un error en una pieza de seguridad es grave. Queda como capa 2, con confirmación.
- **Plantillas fijas en código por tipo de vehículo:** rápido, pero cada caso nuevo exige despliegue y no escala.
- **Un único plan genérico:** el actual; falla en eléctricos, 4x4 y diésel.

## Consecuencias

- Se crea la tabla de plantillas y su carga (script o migración) antes de construir `mantenimiento`.
- Las restricciones de combustible deben aceptar gasolina, gas e híbrido enchufable **en `catalogo.linea` y en `vehiculo`**, y el enum `Combustible` del dominio igual (hoy el catálogo solo admite diésel, híbrido y eléctrico, con nulo para el resto, y el vehículo no admite gas ni híbrido enchufable).
- El perfil del vehículo (combustible, transmisión y tracción) sale del catálogo enriquecido con fuente ([ADR 0021](0021-enriquecimiento-catalogo-por-familia.md)) o de lo que responde la persona; nunca se rellena en silencio.
- Cada capa lleva vectores propios en `contracts/vectores-estado-pieza.json`.
- Para híbridos y gas no hay intervalos propios hasta que la ficha o el manual los den; se marcan "Revisar con el manual".
