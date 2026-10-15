-- RF-GAR-02: al registrar solo son obligatorios el vehículo y el kilometraje. El SOAT puede quedar para después
-- (RF-GAR-02b); el aceite y la RTM ya admitían vacío.
alter table vehiculo alter column registro_soat_fecha drop not null;
