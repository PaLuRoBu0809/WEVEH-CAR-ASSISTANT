-- Catálogo de vehículos de Colombia: tablas de base gravable del Ministerio de Transporte (skill catalogo-vehiculos).
-- Los datos se cargan con plugins/weveh-dev/skills/catalogo-vehiculos/scripts/, no con Flyway.
create schema if not exists extensions;
create extension if not exists pg_trgm with schema extensions;

create table catalogo.marca (
  id                 bigserial primary key,
  nombre             text not null,
  nombre_normalizado text not null unique,
  tipo               text not null check (tipo in ('CARRO', 'MOTO', 'AMBOS'))
);

create table catalogo.linea (
  id                   bigserial primary key,
  marca_id             bigint not null references catalogo.marca (id),
  nombre               text not null,
  nombre_normalizado   text not null,
  clase                text not null,
  tipo_vehiculo        text not null check (tipo_vehiculo in ('CARRO', 'MOTO')),
  tabla_origen         smallint,
  cilindrada_cc        int,
  potencia_kw          numeric(6, 2),
  combustible          text check (combustible in ('DIESEL', 'HIBRIDO', 'ELECTRICO')),
  transmision          text check (transmision in ('AUTOMATICA', 'MECANICA')),
  traccion             text check (traccion in ('4X4', 'AWD', '4X2')),
  puertas              smallint,
  pasajeros            smallint,
  tonelaje             int,
  es_generica          boolean not null default false,
  codigo_mintransporte bigint,
  anio_fiscal          smallint,
  avaluos_miles        jsonb not null default '{}',
  unique nulls not distinct (marca_id, nombre_normalizado, cilindrada_cc, potencia_kw, clase)
);

create index linea_marca_idx on catalogo.linea (marca_id) where not es_generica;
create index linea_nombre_trgm_idx on catalogo.linea using gin (nombre_normalizado extensions.gin_trgm_ops);

alter table catalogo.marca enable row level security;
alter table catalogo.linea enable row level security;
