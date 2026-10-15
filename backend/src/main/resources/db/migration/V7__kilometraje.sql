-- RF-GAR-05: día de la última lectura del kilometraje. Con él se decide si un salto es normal o pide confirmación.
-- Los vehículos que ya existen toman la fecha de hoy.
alter table vehiculo add column km_actualizado_en date not null default current_date;
