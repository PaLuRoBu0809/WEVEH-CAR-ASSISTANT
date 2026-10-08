-- Esquemas del MVP: "catalogo" para las tablas del Ministerio de Transporte y "public" para los datos de la app.
-- Cada tabla nueva debe activar RLS sin políticas: alter table <tabla> enable row level security;
create schema if not exists catalogo;
