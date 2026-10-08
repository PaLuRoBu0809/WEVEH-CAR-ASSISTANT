/** Igual a VehiculoResumen de contracts/openapi.yaml. */
export type TipoVehiculo = 'CARRO' | 'MOTO';

export type VehiculoResumen = Readonly<{
  id: string;
  tipo: TipoVehiculo;
  alias: string | null;
  marca: string;
  linea: string;
  anioModelo: number;
  kilometraje: number;
}>;

export function nombreParaMostrar(vehiculo: VehiculoResumen): string {
  return vehiculo.alias?.trim() || `${vehiculo.marca} ${vehiculo.linea}`;
}
