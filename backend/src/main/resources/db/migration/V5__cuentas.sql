-- Cuentas con Supabase Auth (docs/adr/0005, RF-CTA, RF-DAT). El correo y la contraseña viven en Supabase Auth;
-- aquí solo el perfil (nombre) y los consentimientos. Todo lo de la persona se borra en cascada con su cuenta.

create table usuario (
  id         uuid primary key, -- el id de Supabase Auth (claim sub del token)
  nombre     text not null check (length(nombre) between 1 and 80),
  creado_en  timestamptz not null default now()
);

alter table usuario enable row level security;

-- RF-DAT-02: qué versión de la política aceptó, cuándo y por qué medio
create table consentimiento (
  id               uuid primary key,
  usuario_id       uuid not null references usuario (id) on delete cascade,
  version_politica text not null,
  aceptado_en      timestamptz not null,
  medio            text not null check (medio in ('APP_REGISTRO', 'APP_NUEVA_VERSION'))
);

create index consentimiento_usuario_idx on consentimiento (usuario_id, aceptado_en);

alter table consentimiento enable row level security;

-- Los vehículos creados con dispositivo_id eran de prueba (ADR 0005): se borran (sus consultas se van en cascada)
delete from vehiculo;

alter table vehiculo rename column dispositivo_id to usuario_id;
alter index vehiculo_dispositivo_idx rename to vehiculo_usuario_idx;
alter table vehiculo
  add constraint vehiculo_usuario_fk foreign key (usuario_id) references usuario (id) on delete cascade;
