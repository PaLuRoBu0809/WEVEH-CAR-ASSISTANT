# RF-DOC — Documentos: SOAT, RTM, seguro y demás vencimientos

Reglas: skill `weveh-dev:dominio-vehiculo` (§4). Vectores: `contracts/vectores-vencimientos.json`. Fase 2.

> Actualizado el 2026-10-21 (ampliación propuesta el 2026-10-19 y aprobada): además de SOAT, RTM y seguro todo riesgo, entran el extintor y el kit de carretera, el impuesto vehicular, la licencia de conducción y las multas (RF-DOC-05 a 08). Todo documento vencido cuenta para la salud del vehículo. Los avisos distinguen entre papeles para circular y los demás, para no saturar.

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
- Dado un documento vencido, sea SOAT, RTM, seguro, extintor, impuesto o licencia
  Cuando veo el inicio
  Entonces aparece en "Lo más urgente" y la salud queda en banda "Atención"

## RF-DOC-04 Avisos de vencimiento sin saturar
Como dueño quiero que la app insista en lo importante sin llenarme de notificaciones.
- Dado un SOAT, una RTM o una licencia que vence en 30, 7, 3 o 1 día, o vence hoy
  Cuando llega ese día
  Entonces recibo una notificación local del celular (sin push del servidor)
- Dado un seguro, un extintor o un impuesto que vence en 30 o 7 días, o vence hoy
  Cuando llega ese día
  Entonces recibo una notificación local
- Dado un documento ya vencido
  Cuando pasa el tiempo
  Entonces recibo un aviso diario si es SOAT, RTM o licencia, y uno semanal en los demás, hasta que marque "Ya lo renové" o lo posponga
- Dado que varios documentos avisan el mismo día
  Cuando llega la hora
  Entonces se agrupan en una sola notificación
- Dado que tengo las notificaciones desactivadas
  Cuando abro la app
  Entonces veo un aviso fijo "Sin avisos no podemos recordarte lo que vence" con "Activarlas", que abre los ajustes del celular, y vuelve a aparecer mientras sigan desactivadas

La insistencia alta (diaria al vencer) es para los papeles sin los que no se puede circular (SOAT, RTM, licencia); la media (semanal), para los demás. Es una configuración por tipo de documento, no código distinto. Qué papel va en cada nivel queda por confirmar (D-06).

## RF-DOC-05 Extintor y kit de carretera
Como dueño quiero no olvidar la recarga del extintor ni los elementos obligatorios del vehículo.
- Dado un extintor recargado el 2026-03-01
  Cuando lo registro
  Entonces vence el 2027-03-01 (la recarga es anual)
- Dado que no sé la fecha del extintor
  Cuando la registro
  Entonces la app me explica que el año está en el anillo de seguridad y el mes en la etiqueta
- Dado un extintor vencido
  Cuando veo el kit de carretera
  Entonces se cuenta como faltante, porque un extintor vencido se considera como si no existiera
- Dado que abro la lista del kit de carretera
  Cuando la veo
  Entonces puedo marcar los nueve elementos del artículo 30 de la Ley 769 de 2002: gato, cruceta, dos señales reflectivas o lámparas intermitentes, botiquín, extintor, dos tacos, caja de herramientas, llanta de repuesto y linterna
- Dado que me falta un elemento
  Cuando veo Inicio
  Entonces aparece "Te falta [elemento]" una vez, sin avisos repetidos

La lista del kit no tiene fecha. El botiquín no tiene vencimiento propio en la fuente consultada; la app no inventa una fecha.

## RF-DOC-06 Impuesto vehicular
Como dueño quiero que no se me pase el pago del impuesto vehicular.
- Dado que elijo el departamento de mi vehículo (o Bogotá) y escribo la fecha límite de pago
  Cuando guardo
  Entonces el impuesto vence esa fecha y recibo los avisos de RF-DOC-04
- Dado que cada entidad territorial fija sus propias fechas
  Cuando registro el impuesto
  Entonces la app no calcula la fecha sola: me la pide y me indica dónde consultarla
- Dado que marco "Ya lo pagué"
  Cuando guardo
  Entonces el aviso se cierra y la app me pide la fecha del próximo año cuando se acerque
- Dado un impuesto vencido
  Cuando veo Inicio
  Entonces aparece en "Lo más urgente" y dice que pagar tarde tiene multa e intereses

## RF-DOC-07 Licencia de conducción
Como conductor quiero que me avisen cuando mi licencia esté por vencer.
- Dado que abro Perfil y escribo la fecha de vencimiento de mi licencia
  Cuando guardo
  Entonces la licencia queda en mi cuenta, no en un vehículo, y recibo los avisos de RF-DOC-04
- Dado que tengo varios vehículos
  Cuando veo documentos
  Entonces la licencia aparece una sola vez
- Dado la licencia registrada
  Cuando se guarda
  Entonces solo se guarda la fecha de vencimiento: no el número de licencia ni la cédula (ADR 0005)

La vigencia de la licencia depende de la categoría y la edad (por ejemplo, en particulares, cada 10 años por debajo de los 60). La app pide la fecha que figura en la licencia y no la calcula. La norma se verifica en el Código Nacional de Tránsito antes de mostrar plazos como dato legal.

## RF-DOC-08 Multas
Como dueño quiero que no se me acumulen multas sin atender.
- Dado que activo "Recordarme revisar multas"
  Cuando pasa un mes
  Entonces recibo una notificación con el enlace a la consulta pública del SIMIT, sin guardar datos de la consulta
- Dado que anoto una multa con su fecha límite de pago con descuento
  Cuando se acerca esa fecha
  Entonces recibo el aviso de RF-DOC-04
- Dado una multa anotada y pendiente
  Cuando veo Inicio
  Entonces aparece en "Lo más urgente" y la salud queda en "Atención" hasta que la marque como pagada
- Dado que WEVEH no consulta SIMIT ni RUNT por su cuenta
  Cuando veo la pantalla de multas
  Entonces el texto lo dice con claridad ("tú nos cuentas, nosotros te recordamos")
