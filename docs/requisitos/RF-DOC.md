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

> Pendiente: confirmar que el Decreto 019 de 2012, art. 202 (5 años carros particulares, 2 años motos) sigue vigente antes de mostrarlo como dato legal.

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

## RF-DOC-04 Avisos de vencimiento
Como dueño quiero que me avisen antes de que se venzan mis papeles.
- Dado un SOAT que vence en 30, 7 o 1 día
  Cuando llega ese día
  Entonces recibo una notificación local del celular (sin push del servidor)
