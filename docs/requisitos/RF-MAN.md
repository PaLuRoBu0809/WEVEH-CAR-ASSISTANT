# RF-MAN — Plan de mantenimiento, salud e historial

Fórmulas: skill `weveh-dev:dominio-vehiculo` (§2 y §3). Vectores: `contracts/vectores-estado-pieza.json` y `contracts/vectores-salud.json`. Fase 2.

> Actualizado el 2026-10-21 (ampliación propuesta el 2026-10-19 y aprobada). Cambios de fondo: el plan se arma por perfil del vehículo y por capas (RF-MAN-01, 07); toda pieza lleva km y meses y gana lo que llegue primero (RF-MAN-02); un servicio es una factura con varios trabajos (RF-MAN-04); el agente ayuda a armar el historial (RF-MAN-04b); el kilometraje es el que la persona confirma, nunca una estimación; y la persona puede completar huecos, hacer revisiones rápidas y anotar lo que dice su mecánico (RF-MAN-08, 10, 11).

## RF-MAN-01 Plan base según el perfil del vehículo
Como dueño quiero ver qué mantenimiento necesita mi vehículo exacto desde el primer día, no el de un carro cualquiera.
- Dado que registré un carro de gasolina
  Cuando veo su plan
  Entonces aparecen aceite y filtro, filtro de aire, filtro de combustible, líquido de frenos, pastillas, refrigerante, bujías, correa o cadena de distribución, batería y llantas, marcados "Recomendación general"
- Dado que registré una moto
  Cuando veo su plan
  Entonces además aparece la cadena de transmisión
- Dado que registré un carro eléctrico
  Cuando veo su plan
  Entonces no aparecen aceite, bujías ni distribución, y sí llantas, pastillas, líquido de frenos, refrigerante de la batería, filtro de cabina y batería de 12 voltios
- Dado que registré un carro diésel
  Cuando veo su plan
  Entonces no aparecen bujías de encendido y sí el filtro de combustible con revisión del agua
- Dado que registré un vehículo 4x4 o AWD
  Cuando veo su plan
  Entonces además aparecen el aceite de la caja de transferencia y de los diferenciales
- Dado que la transmisión es manual o automática
  Cuando veo su plan
  Entonces aparece el aceite de la caja que corresponde y, si es manual, el embrague
- Dado que registré un híbrido o un vehículo con conversión a gas
  Cuando veo su plan
  Entonces aparecen las piezas de combustión y una pieza "Revisar con el manual" para el sistema híbrido o de gas, sin intervalo inventado
- Dado que no se conoce algún dato del perfil
  Cuando veo su plan
  Entonces se usa la base más general y veo una tarjeta "Completa el perfil de tu vehículo" (RF-MAN-08)

La plantilla base es una tabla de datos versionada (pieza, a qué perfiles aplica, intervalos), no condiciones en el código (ADR 0016).

## RF-MAN-02 Estado de cada pieza
Como dueño quiero saber qué tan cerca está cada pieza de su próximo servicio.
- Dado aceite con intervalo de 5.000 km y 6 meses, último cambio a los 188.000 km hace 2 meses y el carro en 190.000 km
  Cuando veo el plan
  Entonces la pieza está "Al día" y dice "Faltan 3.000 km"
- Dado una pieza con consumo entre 85 % y 100 %
  Cuando veo el plan
  Entonces dice "Ya casi toca"
- Dado una pieza con consumo de 100 % o más
  Cuando veo el plan
  Entonces dice "Se pasó por N km" o "Se pasó por N meses"
- Dado aceite de 10.000 km y 12 meses, último cambio hace 13 meses y solo 4.000 km recorridos
  Cuando veo el plan
  Entonces dice "Se pasó por 1 mes", porque gana lo que llega primero entre los kilómetros y el tiempo
- Dado una pieza sin último servicio conocido
  Cuando veo el plan
  Entonces dice "No sabemos cuándo se hizo"
- Dado una pieza de seguridad sin último servicio conocido y un kilometraje que superó el margen que recomienda el fabricante para esa pieza
  Cuando veo el plan
  Entonces el estado es "Sin dato · revisar ya", aparece en "Lo más urgente" y no se llama "Vencida"
- Dado que el kilometraje confirmado tiene 20 días
  Cuando veo el plan
  Entonces cada estado dice que se calculó con el kilometraje de hace 20 días

El consumo es el mayor entre consumo por km y consumo por tiempo. Toda pieza se define con kilómetros y meses cuando el manual da ambos (llantas incluyen su edad). El margen del fabricante lo investiga el agente (RF-PER-01); mientras no exista, para piezas de seguridad se usa el 100 % del intervalo. El estado "Sin dato · revisar ya" (`SIN_DATO_REVISAR_YA`) entra a los vectores de `contracts/vectores-estado-pieza.json`.

## RF-MAN-03 Salud del vehículo
Como dueño quiero un número y un color que me digan cómo está mi vehículo, cuando haya datos suficientes para que sea confiable.
- Dado que menos de la mitad de las piezas de mi plan tiene dato (por ejemplo, recién registrado)
  Cuando veo Inicio
  Entonces veo el estado de cada pieza, pero en vez del puntaje general veo "Completa el perfil para ver la salud de tu vehículo" con las tarjetas de lo que falta
- Dado que la mayoría de piezas tiene dato, todas están al día y los documentos vigentes
  Cuando veo el inicio
  Entonces la salud está entre 90 y 100, banda "Al día"
- Dado que una pieza de seguridad (frenos, llantas, dirección, distribución) está vencida
  Cuando veo el inicio
  Entonces la salud queda entre 0 y 39, banda "Atención", aunque el resto esté bien
- Dado cualquier documento vencido (SOAT, RTM, seguro, extintor, impuesto, licencia o una multa pendiente)
  Cuando veo el inicio
  Entonces aparece en "Lo más urgente" y la salud queda en la banda "Atención"
- Dado una pieza de seguridad en "Sin dato · revisar ya"
  Cuando veo el inicio
  Entonces la salud no puede estar en "Al día" y como mejor resultado queda en la banda "Revisar"
- Dado que la Prado del ejemplo tiene la distribución sin dato a 190.000 km
  Cuando veo el inicio
  Entonces "Lo más urgente" muestra primero lo vencido y luego lo que está por vencer o sin dato de seguridad

Las bandas oficiales son cuatro: Atención 0–39, Revisar 40–69, Pronto 70–89 y Al día 90–100 (skill dominio-vehiculo §3). Hasta que se confirme (D-02), se asume "datos suficientes" = más de la mitad de las piezas con dato.

## RF-MAN-04 Registrar un servicio (una factura con varios trabajos)
Como dueño quiero anotar lo que le hicieron al vehículo tal como aparece en la factura.
- Dado que registro un servicio con fecha de hoy, 190.500 km y taller, y agrego "Aceite 5W-30 sintético" (cambio), "Filtro de aceite" (cambio) y "Filtro de aire" (revisión)
  Cuando guardo
  Entonces aparece un solo servicio en el historial con sus tres trabajos, el aceite y su filtro vuelven a "Al día" y el filtro de aire queda revisado sin reiniciar su intervalo de cambio
- Dado que elijo el kit rápido "Cambio de aceite"
  Cuando se abre el formulario
  Entonces ya están agregados el aceite y el filtro de aceite, y solo completo la especificación
- Dado que el km del servicio es mayor al kilometraje actual
  Cuando guardo
  Entonces el kilometraje del vehículo se actualiza a ese valor
- Dado que el servicio incluye una recomendación del mecánico ("cambiar amortiguadores en 3 meses")
  Cuando guardo
  Entonces queda como pendiente con su fecha objetivo (RF-MAN-11)
- Dado que anoto el total pagado y el nombre del taller
  Cuando guardo
  Entonces ambos son opcionales y quedan en el servicio

Un servicio tiene fecha, km, taller, total opcional, notas y recomendaciones. Cada trabajo tiene pieza, acción (cambio, revisión o ajuste) y especificación (ADR 0017). Solo el cambio reinicia el intervalo de la pieza.

## RF-MAN-04b Contarle el servicio al agente
Como dueño quiero contar el servicio con mis palabras, escrito o hablado, y que el agente arme el registro completo preguntándome lo que falte.
- Dado que escribo "Hoy le cambié el aceite y el filtro en Lubricentro X, a 188.500 km, me cobraron 180 mil"
  Cuando envío
  Entonces el agente me muestra un borrador del servicio con esos datos para confirmar y no se guarda nada antes de confirmar
- Dado que al borrador le falta el kilometraje o la fecha
  Cuando el agente lo arma
  Entonces me pregunta solo lo que falta, una cosa a la vez, con la opción "No sé"
- Dado que mando un audio con el servicio
  Cuando termina de transcribirse (RF-MIA-11)
  Entonces veo el texto, puedo corregirlo y sigue igual que si lo hubiera escrito
- Dado que el modelo propone un servicio inválido (km negativo, fecha futura, pieza que no existe en mi plan)
  Cuando el backend lo valida
  Entonces no se muestra como borrador y el agente me pide aclarar
- Dado que en mi relato menciono un síntoma que sigue pasando
  Cuando el agente lo detecta
  Entonces me ofrece abrir una ficha de falla (RF-MIA-01c)

## RF-MAN-04c Foto de la factura como evidencia
Como dueño quiero guardar la foto de la factura junto al servicio.
- Dado que adjunto la foto de la factura
  Cuando guardo el servicio
  Entonces la foto queda guardada con ese servicio y ningún modelo la lee (ADR 0018)
- Dado que elimino el servicio o mi cuenta
  Cuando se borra
  Entonces la foto se borra también, en menos de 24 horas (RNF-26)
- Dado que no tengo red
  Cuando adjunto la foto
  Entonces espera en el celular y se sube sola al volver la conexión
- Dado que la foto es muy pesada
  Cuando la adjunto
  Entonces se reduce antes de subirla (RNF-33)

## RF-MAN-05 Ver historial
Como dueño quiero ver los servicios y fallas pasadas ordenadas del más reciente al más antiguo.
- Dado que tengo tres servicios registrados
  Cuando abro el historial
  Entonces los veo con fecha, km, taller, total si lo anoté y los trabajos que incluyeron
- Dado un servicio con foto de factura
  Cuando lo abro
  Entonces veo la foto, las notas y las recomendaciones del mecánico
- Dado que filtro por una pieza
  Cuando abro el historial
  Entonces veo solo los servicios en los que se trabajó esa pieza
- Dado que hay fallas abiertas o cerradas
  Cuando abro el historial
  Entonces aparecen junto a los servicios, ordenadas por fecha

## RF-MAN-06 Editar un intervalo
Como dueño quiero ajustar el intervalo de una pieza si mi mecánico me dio otro.
- Dado que cambio el intervalo del aceite a 10.000 km
  Cuando guardo
  Entonces la pieza queda con origen "Usuario" y su estado se recalcula

## RF-MAN-07 El plan se adapta a mi vehículo
Como dueño quiero que mi plan sea el reflejo de mi vehículo, no una lista general.
- Dado que mi vehículo tiene ficha del modelo confirmada (RF-PER-03)
  Cuando veo mi plan
  Entonces los intervalos y piezas de la ficha reemplazan a los de la plantilla base y cada uno dice su origen y su fuente
- Dado que mi uso es severo (RF-PER-07) y la ficha trae el calendario de servicio severo del fabricante
  Cuando veo mi plan
  Entonces uso esos intervalos más cortos y se me explica por qué
- Dado que mi historia trae una bandera como motor cambiado o conversión a gas (RF-PER-08)
  Cuando veo mi plan
  Entonces se reconstruye con el perfil nuevo y las piezas afectadas quedan en "Sin dato" hasta que yo informe lo que se hizo
- Dado que aún no hay ficha ni entrevista
  Cuando veo mi plan
  Entonces se usa la plantilla base según el perfil (RF-MAN-01)

Las capas, en orden: plantilla base por perfil, ficha del modelo investigada, condiciones de uso, historia del vehículo, y lo que la persona edite o diga que dijo su mecánico (ADR 0016). La IA propone; la persona confirma; las reglas que calculan estados siguen siendo código.

## RF-MAN-08 Tarjetas para completar lo que falta
Como dueño quiero que la app me muestre en tarjetas lo que le falta saber de mi vehículo, con respuestas rápidas.
- Dado una pieza sin dato
  Cuando abro la pieza
  Entonces veo "¿Cuándo fue lo último que le hicieron?" con las opciones "Hace menos de 6 meses", "Entre 6 y 12 meses", "Hace más de un año", "Nunca" y "No sé"
- Dado que respondo "Hace más de un año" en la correa de distribución
  Cuando guardo
  Entonces queda una fecha aproximada, tomando el extremo más antiguo del rango en piezas de seguridad, y el estado se recalcula
- Dado que respondo "Nunca" o "No sé" en una pieza de seguridad cuyo kilometraje superó el margen del fabricante
  Cuando guardo
  Entonces queda en "Sin dato · revisar ya" con la sugerencia de llevarla a revisión
- Dado que a mi perfil le faltan cosas (aceite, papeles, uso y entorno, historia, tipo de combustible)
  Cuando abro Inicio
  Entonces veo hasta tres tarjetas, con las de seguridad primero, y cada una dice "Responder ahora" o "Más tarde"
- Dado que tengo tarjetas pendientes
  Cuando le pregunto al Mecánico IA
  Entonces su respuesta menciona lo que le falta saber (RF-MIA-05)

## RF-MAN-09 Avisos de mantenimiento
Como dueño quiero que la app me avise cuando una pieza está por tocar, sin llenarme de notificaciones.
- Dado una pieza con intervalo en meses y un último servicio con fecha
  Cuando la fecha llega al 85 % del plazo
  Entonces recibo una notificación local "Ya casi toca" que dice que se calculó con la fecha del último servicio
- Dado una pieza por kilómetros
  Cuando actualizo el kilometraje y la pieza pasa del 85 % o del 100 %
  Entonces recibo el aviso en ese momento, que dice con qué kilometraje se calculó
- Dado una pieza de seguridad vencida o en "Sin dato · revisar ya"
  Cuando pasa una semana sin atenderla
  Entonces recibo un recordatorio semanal hasta que la atienda
- Dado varios avisos el mismo día
  Cuando llega la hora
  Entonces se agrupan en una sola notificación ("3 piezas necesitan atención")
- Dado que el sistema limita las notificaciones programadas
  Cuando la app programa los avisos
  Entonces programa solo los más próximos y completa el resto cada vez que abro la app (ADR 0020)
- Dado que silencio los avisos de una pieza
  Cuando llega su fecha
  Entonces no se avisa, pero la pieza sigue apareciendo en el plan

Los avisos son locales, no push del servidor. Para no saturar: un aviso en "Ya casi toca", otro al vencer y uno semanal solo para piezas de seguridad; no se copian los 30/7/3/1 de los papeles.

## RF-MAN-10 Revisiones rápidas
Como dueño quiero hacer revisiones sencillas yo mismo y que lo que vea alimente el plan.
- Dado que abro "Revisión rápida" (recordatorio mensual, configurable)
  Cuando empieza
  Entonces veo cuatro chequeos: nivel de aceite, nivel de refrigerante, llantas (presión y labrado en milímetros) y luces
- Dado un carro de hasta 3.500 kg con un labrado de 2,0 mm o menos
  Cuando guardo la revisión
  Entonces las llantas pasan a "Ya casi toca"
- Dado un carro de hasta 3.500 kg con un labrado menor a 1,6 mm
  Cuando guardo la revisión
  Entonces las llantas pasan a "Se pasó" (NTC 5375)
- Dado una moto con un labrado menor a 1,0 mm
  Cuando guardo la revisión
  Entonces las llantas pasan a "Se pasó"
- Dado que el nivel de aceite o de refrigerante está bajo
  Cuando guardo la revisión
  Entonces la pieza pasa a "Ya casi toca" y se me sugiere completar el nivel y preguntarle al Mecánico IA si baja de nuevo
- Dado que veo un testigo encendido o un ruido
  Cuando lo anoto en la revisión
  Entonces un testigo rojo pasa por la regla de seguridad (RF-MIA-03) y un ruido abre una ficha con el Mecánico IA (RF-MIA-01c)
- Dado una observación más reciente que el último servicio y más grave que el estado calculado
  Cuando veo la pieza
  Entonces manda la observación hasta que registre un servicio de esa pieza

Versión mínima: aceite, refrigerante, llantas y luces. Los umbrales de labrado salen de la NTC 5375; el de aviso (2,0 mm en carros y 1,5 mm en motos) lo confirma el equipo (D-10). Una observación nunca baja el estado que ya marcó el validador de seguridad.

## RF-MAN-11 Lo que dijo mi mecánico
Como dueño quiero anotar el concepto de mi mecánico y que pese más que el intervalo.
- Dado que anoto en las pastillas "cambiarlas en 3 meses"
  Cuando guardo
  Entonces la pieza muestra "Concepto de tu mecánico: cambiar antes del [fecha]" y su estado usa ese plazo en vez del intervalo
- Dado un concepto vigente "está bien" sobre una pieza cuyo intervalo ya venció
  Cuando veo el plan
  Entonces la pieza dice "Al día según tu mecánico" hasta que el concepto venza
- Dado que el concepto llega a su vigencia (por fecha o por kilómetros)
  Cuando veo el plan
  Entonces vuelve a regir el intervalo calculado
- Dado que registro un servicio de esa pieza
  Cuando guardo
  Entonces el concepto se cierra
- Dado un concepto "está bien" sobre los frenos y que después describo un síntoma crítico en frenos
  Cuando pregunto al Mecánico IA
  Entonces la regla de seguridad gana (RF-MIA-03)
- Dado una recomendación del mecánico anotada con un servicio (RF-MAN-04)
  Cuando veo el plan
  Entonces aparece como pendiente en su pieza y se marca "Hecha" al registrar el servicio

Precedencia: 1) regla de seguridad por síntomas, 2) concepto vigente del mecánico, 3) observación más reciente de la persona, 4) intervalo calculado (ADR 0017). Vigencia por defecto del concepto: 90 días o 3.000 km, lo que llegue primero (por confirmar, D-07). Es información de la persona: no se usa para ajustar ningún modelo.
