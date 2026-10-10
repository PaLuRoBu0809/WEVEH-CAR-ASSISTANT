export type TipoVehiculo = 'CARRO' | 'MOTO';

export type MarcaCatalogo = Readonly<{
  id: number;
  nombre: string;
  tipo: TipoVehiculo | 'AMBOS';
}>;

export type LineaCatalogo = Readonly<{
  id: number;
  marcaId: number;
  nombre: string;
  clase: string;
  tipoVehiculo: TipoVehiculo;
  cilindradaCc: number | null;
  potenciaKw: number | null;
  combustible: 'DIESEL' | 'HIBRIDO' | 'ELECTRICO' | null;
  transmision: 'AUTOMATICA' | 'MECANICA' | null;
  traccion: '4X2' | '4X4' | 'AWD' | null;
  puertas: number | null;
}>;

const formatoMiles = new Intl.NumberFormat('es-CO');

/** "PRADO VX 5P AT · 3.400 cc", como en el registro de la skill catalogo-vehiculos. */
export function nombreLinea(linea: LineaCatalogo): string {
  if (linea.cilindradaCc) {
    return `${linea.nombre} · ${formatoMiles.format(linea.cilindradaCc)} cc`;
  }
  if (linea.potenciaKw) {
    return `${linea.nombre} · ${formatoMiles.format(linea.potenciaKw)} kW`;
  }
  return linea.nombre;
}
