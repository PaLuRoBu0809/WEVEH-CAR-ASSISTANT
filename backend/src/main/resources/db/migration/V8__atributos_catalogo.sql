-- RF-CAT-04 y RF-CAT-05 (ADR 0021): combustibles que faltaban y atributos de la línea investigados con fuente.

-- La gasolina, el gas y el híbrido enchufable se pueden guardar. Nulo sigue significando "sin dato".
alter table catalogo.linea drop constraint linea_combustible_check;
alter table catalogo.linea add constraint linea_combustible_check
  check (combustible in ('GASOLINA', 'DIESEL', 'GAS', 'HIBRIDO', 'HIBRIDO_ENCHUFABLE', 'ELECTRICO'));

alter table vehiculo drop constraint vehiculo_combustible_check;
alter table vehiculo add constraint vehiculo_combustible_check
  check (combustible in ('GASOLINA', 'DIESEL', 'GAS', 'HIBRIDO', 'HIBRIDO_ENCHUFABLE', 'ELECTRICO'));

-- Lo que el nombre de la línea no dice, investigado por familia (capa 1) o corregido por el equipo. No reemplaza
-- las columnas de catalogo.linea: cada dato queda con su origen y su fuente, y un lote malo se borra por `lote`.
create table catalogo.atributo_linea (
  id          bigserial primary key,
  linea_id    bigint not null references catalogo.linea (id) on delete cascade,
  atributo    text not null check (atributo in ('COMBUSTIBLE', 'TRANSMISION', 'TRACCION')),
  valores     text[] not null check (cardinality(valores) > 0),
  origen      text not null check (origen in ('CATALOGO', 'IA_WEB', 'EQUIPO')),
  fuente_url  text,
  cita        text,
  tipo_fuente text check (tipo_fuente in ('FABRICANTE', 'CONCESIONARIO', 'FICHA_TECNICA', 'PRENSA', 'FORO')),
  verificada  boolean not null default false,
  revisado_en timestamptz,
  lote        text,
  creado_en   timestamptz not null default now(),
  unique (linea_id, atributo, origen),
  -- CLAUDE.md §8.5: un dato de la web siempre lleva su fuente
  constraint atributo_linea_web_con_fuente check (origen <> 'IA_WEB' or fuente_url is not null)
);

create index atributo_linea_linea_idx on catalogo.atributo_linea (linea_id);

alter table catalogo.atributo_linea enable row level security;
