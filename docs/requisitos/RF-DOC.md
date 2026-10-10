# RF-DOC — Documentos: SOAT, RTM y seguro todo riesgo

Reglas: skill `weveh-dev:dominio-vehiculo` (§4). Vectores: `contracts/vectores-vencimientos.json`. Fase 2.

## RF-DOC-01 Calcular vencimientos
Como dueño quiero registrar cuándo saqué mis papeles y que WEVEH me diga cuándo vencen.
- Dado SOAT expedido el 2026-06-30
  Cuando lo registro
  Entonces vence el 2027-06-30
- Dado la última RTM el 2026-06-28
  Cuando la registro
  Entonces vence el 2027-06-28
- Dado seguro todo riesgo con inicio el 2026-07-05
  Cuando lo registro
  Entonces vence el 2027-07-05 y puedo editar esa fecha

## RF-DOC-02 RTM que aún no aplica
Como dueño de un vehículo nuevo quiero saber cuándo me toca la primera revisión.
- Dado un carro particular matriculado el 2024-03-10 y marco "aún no aplica"
  Cuando registro
  Entonces la primera RTM se calcula para el 2029-03-10
- Dado una moto matriculada el 2025-01-15 y marco "aún no aplica"
  Cuando registro
  Entonces la primera RTM se calcula para el 2027-01-15
- Dado que marco "aún no aplica" y no di la fecha de matrícula
  Cuando registro
  Entonces la app me pide la fecha de matrícula para calcularla

> Confirmado por el equipo (2026-10-08): Decreto 019 de 2012, art. 202 vigente. Carros particulares: primera RTM a los 5 años de la matrícula y luego cada año. Motos: primera a los 2 años y luego cada año.

- Dado un carro particular cuya primera RTM fue el 2029-03-10
  Cuando la registro
  Entonces la siguiente vence el 2030-03-10

## RF-DOC-03 Estado de cada documento
Como dueño quiero ver de un vistazo si mis papeles están al día.
- Dado un documento que vence en más de 30 días
  Cuando veo documentos
  Entonces dice "Vigente"
- Dado un documento que vence en 30 días o menos
  Cuando veo documentos
  Entonces dice "Por vencer" y cuántos días faltan
- Dado un documento vencido
  Cuando veo el inicio
  Entonces aparece en "Lo más urgente" y la salud queda en banda "Atención"

## RF-DOC-04 Avisos insistentes de vencimiento
Como dueño quiero que la app insista para que no se me pase nada.
- Dado un SOAT que vence en 30, 7, 3 o 1 día, o vence hoy
  Cuando llega ese día
  Entonces recibo una notificación local del celular (sin push del servidor)
- Dado un documento ya vencido
  Cuando pasa cada día
  Entonces recibo un aviso diario hasta que marque "Ya lo renové" o lo posponga
- Dado que tengo las notificaciones desactivadas
  Cuando abro la app
  Entonces veo un aviso fijo "Sin avisos no podemos recordarte lo que vence" con "Activarlas", que abre los ajustes del celular, y vuelve a aparecer mientras sigan desactivadas
