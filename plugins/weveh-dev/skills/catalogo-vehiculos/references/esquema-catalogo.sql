-- Esquema del catálogo de vehículos de Colombia (tablas de base gravable del Ministerio de Transporte).
-- En el backend va como migración Flyway (V<n>__catalogo.sql). Los datos se cargan con el script, no con Flyway.

create schema if not exists catalogo;
create extension if not exists pg_trgm;

create table catalogo.marca (
  id                 bigserial primary key,
  nombre             text not null,
  nombre_normalizado text not null unique,
  tipo               text not null check (tipo in ('CARRO', 'MOTO', 'AMBOS'))
);

create table catalogo.linea (
  id                   bigserial primary key,
  marca_id             bigint not null references catalogo.marca (id),
  nombre               text not null,               -- tal cual viene: "PRADO VX 5P AT"
  nombre_normalizado   text not null,               -- sin tildes y en minúsculas, para buscar
  clase                text not null,               -- AUTOMOVIL, CAMIONETAS Y CAMPEROS, DOBLECABINA, MOTOCICLETA...
  tipo_vehiculo        text not null check (tipo_vehiculo in ('CARRO', 'MOTO')),
  tabla_origen         smallint,                    -- número de tabla del Ministerio (1, 2, 3, 5, 9...)
  cilindrada_cc        int,
  potencia_kw          numeric(6, 2),               -- solo eléctricos
  combustible          text check (combustible in ('DIESEL', 'HIBRIDO', 'ELECTRICO')),   -- inferido; null = sin dato
  transmision          text check (transmision in ('AUTOMATICA', 'MECANICA')),           -- inferido del nombre
  traccion             text check (traccion in ('4X4', 'AWD', '4X2')),                   -- inferido del nombre
  puertas              smallint,
  pasajeros            smallint,
  tonelaje             int,
  es_generica          boolean not null default false,  -- "LINEAS Y CILINDRAJES NO INCLUIDOS...", "SIN LINEA"
  codigo_mintransporte bigint,                      -- no es único ni siempre viene
  anio_fiscal          smallint,
  avaluos_miles        jsonb not null default '{}', -- {"2008": 41210, ...} base gravable en miles de pesos
  unique nulls not distinct (marca_id, nombre_normalizado, cilindrada_cc, potencia_kw, clase)
);

create index linea_marca_idx on catalogo.linea (marca_id) where not es_generica;
create index linea_nombre_trgm_idx on catalogo.linea using gin (nombre_normalizado gin_trgm_ops);

alter table catalogo.marca enable row level security;
alter table catalogo.linea enable row level security;
