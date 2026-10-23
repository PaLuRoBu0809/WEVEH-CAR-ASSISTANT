-- ADR 0009 y RF-GAR-06: un cambio hecho sin red se envía con un Idempotency-Key y se guarda una sola vez. Si llega
-- otra vez (la app reintenta al volver la red), se responde lo mismo sin aplicarlo de nuevo.
create table cambio_procesado (
  usuario_id     uuid not null references usuario (id) on delete cascade,
  clave          uuid not null,
  metodo         text not null,
  ruta           text not null,
  estado_http    int not null,
  tipo_contenido text,
  cuerpo         text,
  procesado_en   timestamptz not null default now(),
  primary key (usuario_id, clave)
);

create index cambio_procesado_fecha_idx on cambio_procesado (procesado_en);

alter table cambio_procesado enable row level security;
