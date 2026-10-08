/** Igual a VehiculoRespuesta del backend (contracts/openapi.yaml). */
export type TipoVehiculo = 'CARRO' | 'MOTO';
export type UsoVehiculo = 'CIUDAD' | 'CARRETERA' | 'MIXTO';
export type Combustible = 'GASOLINA' | 'DIESEL' | 'HIBRIDO' | 'ELECTRICO';
export type Transmision = 'AUTOMATICA' | 'MECANICA';
export type Traccion = '4X2' | '4X4' | 'AWD';

export type VehiculoResumen = Readonly<{
  id: string;
  tipo: TipoVehiculo;
  catalogoLineaId: number | null;
  alias: string | null;
  marca: string;
  linea: string;
  cilindradaCc: number | null;
  anioModelo: number;
  combustible: Combustible | null;
  transmision: Transmision | null;
  traccion: Traccion | null;
  placa: string | null;
  fechaMatricula: string | null;
  kilometraje: number;
  uso: UsoVehiculo;
  kmPromedioMes: number;
  versionFila: number;
}>;

/** Lo que envía el registro básico (RF-GAR-02). Fechas en ISO AAAA-MM-DD. */
export type SolicitudRegistro = Readonly<{
  tipo: TipoVehiculo;
  catalogoLineaId: number | null;
  marca: string;
  linea: string;
  cilindradaCc: number | null;
  anioModelo: number;
  combustible: Combustible | null;
  transmision: Transmision | null;
  traccion: Traccion | null;
  kilometraje: number;
  uso: UsoVehiculo;
  kmPromedioMes: number;
  aceiteKm: number | null;
  aceiteFecha: string | null;
  soatFecha: string;
  rtmFecha: string | null;
  rtmAunNoAplica: boolean;
  fechaMatricula: string | null;
  seguroInicio: string | null;
  seguroEntidad: string | null;
  alias: string | null;
  placa: string | null;
}>;

export function nombreParaMostrar(vehiculo: Pick<VehiculoResumen, 'alias' | 'marca' | 'linea'>): string {
  return vehiculo.alias?.trim() || `${vehiculo.marca} ${vehiculo.linea}`;
}
