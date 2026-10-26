-- Mecánico IA conversacional (RF-MIA-02, RF-MIA-06) y tope diario por cuenta (RF-MIA-07). consulta_mecanico (V4)
-- queda como histórico y ya no se escribe.
create table conversacion_mecanico (
  id              uuid primary key,
  vehiculo_id     uuid not null references vehiculo (id) on delete cascade,
  creada_en       timestamptz not null default now(),
  actualizada_en  timestamptz not null default now()
);

create index conversacion_mecanico_vehiculo_idx on conversacion_mecanico (vehiculo_id, actualizada_en desc);

-- La tarjeta se guarda ya validada (gravedad y plazo del código); null cuando el mensaje no describía un síntoma.
create table mensaje_mecanico (
  orden           bigint generated always as identity primary key,
  id              uuid not null unique,
  conversacion_id uuid not null references conversacion_mecanico (id) on delete cascade,
  rol             text not null check (rol in ('PERSONA', 'MECANICO')),
  texto           text not null,
  tarjeta         jsonb,
  modelo          text,
  version_prompt  text,
  creado_en       timestamptz not null default now()
);

create index mensaje_mecanico_conversacion_idx on mensaje_mecanico (conversacion_id, orden);

-- Solo cuenta: nunca el texto ni el audio.
create table uso_ia (
  id          bigint generated always as identity primary key,
  usuario_id  uuid not null references usuario (id) on delete cascade,
  tipo        text not null check (tipo in ('MENSAJE', 'AUDIO')),
  creado_en   timestamptz not null default now()
);

create index uso_ia_usuario_idx on uso_ia (usuario_id, creado_en);

alter table conversacion_mecanico enable row level security;
alter table mensaje_mecanico enable row level security;
alter table uso_ia enable row level security;
