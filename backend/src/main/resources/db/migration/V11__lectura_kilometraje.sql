-- ADR 0023: historial de lecturas del kilometraje. Permite corregir la última lectura en sus primeros 7 días sin
-- quedar por debajo de la anterior. Cada vehículo arranca con su lectura de hoy.
create table lectura_kilometraje (
  id            bigint generated always as identity primary key,
  vehiculo_id   uuid not null references vehiculo (id) on delete cascade,
  km            int not null check (km between 0 and 2000000),
  leido_en      date not null,
  corregida     boolean not null default false,
  registrado_en timestamptz not null default now()
);

create index lectura_kilometraje_vehiculo_idx on lectura_kilometraje (vehiculo_id, id desc);

alter table lectura_kilometraje enable row level security;

insert into lectura_kilometraje (vehiculo_id, km, leido_en)
select id, km, km_actualizado_en from vehiculo;
