-- Mecánico IA (RF-MIA-06): cada consulta con su diagnóstico ya validado, el modelo y la versión del prompt.
create table consulta_mecanico (
  id              uuid primary key,
  vehiculo_id     uuid not null references vehiculo (id) on delete cascade,
  sintoma         text not null,
  nivel_gravedad  text not null check (nivel_gravedad in ('LEVE', 'MODERADO', 'CRITICO')),
  diagnostico     jsonb not null,
  respuesta_segura boolean not null default false,
  modelo          text not null,
  version_prompt  text not null,
  creado_en       timestamptz not null default now()
);

create index consulta_mecanico_vehiculo_idx on consulta_mecanico (vehiculo_id, creado_en);

alter table consulta_mecanico enable row level security;
