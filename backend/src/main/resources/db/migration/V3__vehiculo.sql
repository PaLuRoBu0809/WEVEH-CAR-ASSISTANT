-- Garaje (RF-GAR-02). Marca, línea y cilindrada se guardan como texto además del id del catálogo, sin llave foránea:
-- recargar el catálogo de otro año fiscal no rompe los vehículos (skill catalogo-vehiculos §4).
create table vehiculo (
  id                        uuid primary key,
  dispositivo_id            uuid not null,
  tipo                      text not null check (tipo in ('CARRO', 'MOTO')),
  catalogo_linea_id         bigint,
  marca                     text not null,
  linea                     text not null,
  cilindrada_cc             int,
  anio_modelo               int not null check (anio_modelo between 1950 and 2100),
  combustible               text check (combustible in ('GASOLINA', 'DIESEL', 'HIBRIDO', 'ELECTRICO')),
  transmision               text check (transmision in ('AUTOMATICA', 'MECANICA')),
  traccion                  text check (traccion in ('4X2', '4X4', 'AWD')),
  alias                     text,
  placa                     text,
  fecha_matricula           date,
  km                        int not null check (km between 0 and 2000000),
  uso                       text not null check (uso in ('CIUDAD', 'CARRETERA', 'MIXTO')),
  km_promedio_mes           int not null check (km_promedio_mes between 0 and 20000),
  estado_perfil             text not null default 'BASICO',
  -- Datos del registro básico que consumen mantenimiento y documentos (fase 2)
  registro_aceite_km        int,
  registro_aceite_fecha     date,
  registro_soat_fecha       date not null,
  registro_rtm_fecha        date,
  registro_rtm_aun_no_aplica boolean not null default false,
  registro_seguro_inicio    date,
  registro_seguro_entidad   text,
  version_fila              int not null default 0,
  creado_en                 timestamptz not null default now()
);

create index vehiculo_dispositivo_idx on vehiculo (dispositivo_id);

alter table vehiculo enable row level security;
