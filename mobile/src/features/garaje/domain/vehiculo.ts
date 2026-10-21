/** Igual a VehiculoRespuesta del backend (contracts/openapi.yaml). */
export type TipoVehiculo = 'CARRO' | 'MOTO';
export type UsoVehiculo = 'CIUDAD' | 'CARRETERA' | 'MIXTO';
export type Combustible = 'GASOLINA' | 'DIESEL' | 'GAS' | 'HIBRIDO' | 'HIBRIDO_ENCHUFABLE' | 'ELECTRICO';
export type Transmision = 'AUTOMATICA' | 'MECANICA';
export type Traccion = '4X2' | '4X4' | 'AWD';

type OpcionAtributo<T extends string> = Readonly<{ valor: T; texto: string }>;

/** Textos de UI de cada valor, en el orden en que se ofrecen (RF-CAT-04, RF-GAR-03). */
export const COMBUSTIBLES: readonly OpcionAtributo<Combustible>[] = [
  { valor: 'GASOLINA', texto: 'Gasolina' },
  { valor: 'DIESEL', texto: 'Diésel' },
  { valor: 'GAS', texto: 'Gas' },
  { valor: 'HIBRIDO', texto: 'Híbrido' },
  { valor: 'HIBRIDO_ENCHUFABLE', texto: 'Híbrido enchufable' },
  { valor: 'ELECTRICO', texto: 'Eléctrico' },
];

export const TRANSMISIONES: readonly OpcionAtributo<Transmision>[] = [
  { valor: 'MECANICA', texto: 'Mecánica' },
  { valor: 'AUTOMATICA', texto: 'Automática' },
];

export const TRACCIONES: readonly OpcionAtributo<Traccion>[] = [
  { valor: '4X2', texto: '4x2' },
  { valor: '4X4', texto: '4x4' },
  { valor: 'AWD', texto: 'AWD' },
];

/** Lo que la persona dejó para después en el registro (RF-GAR-02b). */
export type DatoFaltante = 'SOAT' | 'RTM' | 'ACEITE';

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
  /** Día de la última lectura del kilometraje (ISO). */
  kmActualizadoEn: string;
  uso: UsoVehiculo;
  kmPromedioMes: number;
  aceiteKm: number | null;
  aceiteFecha: string | null;
  soatFecha: string | null;
  rtmFecha: string | null;
  rtmAunNoAplica: boolean;
  seguroInicio: string | null;
  seguroEntidad: string | null;
  datosFaltantes: readonly DatoFaltante[];
  versionFila: number;
}>;

/** RF-GAR-03: lo que se puede corregir. Se envía la versión que tenía la app. */
export type EdicionVehiculo = Readonly<{
  alias: string | null;
  placa: string | null;
  uso: UsoVehiculo;
  kmPromedioMes: number;
  fechaMatricula: string | null;
  combustible: Combustible | null;
  transmision: Transmision | null;
  traccion: Traccion | null;
  versionFila: number;
}>;

/** RF-GAR-02b: el aceite y los papeles como quedan; lo vacío sigue pendiente. */
export type RegistroCompletado = Readonly<{
  aceiteKm: number | null;
  aceiteFecha: string | null;
  soatFecha: string | null;
  rtmFecha: string | null;
  rtmAunNoAplica: boolean;
  seguroInicio: string | null;
  seguroEntidad: string | null;
  versionFila: number;
}>;

const NOMBRE_FALTANTE: Readonly<Record<DatoFaltante, string>> = {
  SOAT: 'el SOAT',
  RTM: 'la revisión técnico-mecánica',
  ACEITE: 'el último cambio de aceite',
};

/** "el SOAT, la revisión técnico-mecánica y el último cambio de aceite". */
export function listaFaltantes(faltan: readonly DatoFaltante[]): string {
  const nombres = faltan.map((dato) => NOMBRE_FALTANTE[dato]);
  if (nombres.length <= 1) return nombres.join('');
  return `${nombres.slice(0, -1).join(', ')} y ${nombres[nombres.length - 1]}`;
}

/** Título del aviso en Inicio: los papeles primero, porque vencen y tienen multa. */
export function tituloFaltantes(nombre: string, faltan: readonly DatoFaltante[]): string {
  const faltanPapeles = faltan.includes('SOAT') || faltan.includes('RTM');
  return faltanPapeles ? `Te faltan los papeles de ${nombre}` : `Te falta un dato de ${nombre}`;
}

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
  soatFecha: string | null;
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
