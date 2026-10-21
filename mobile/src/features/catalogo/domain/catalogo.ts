export type TipoVehiculo = 'CARRO' | 'MOTO';

export type MarcaCatalogo = Readonly<{
  id: number;
  nombre: string;
  tipo: TipoVehiculo | 'AMBOS';
}>;

export type CombustibleCatalogo = 'GASOLINA' | 'DIESEL' | 'GAS' | 'HIBRIDO' | 'HIBRIDO_ENCHUFABLE' | 'ELECTRICO';
export type TransmisionCatalogo = 'AUTOMATICA' | 'MECANICA';
export type TraccionCatalogo = '4X2' | '4X4' | 'AWD';

/**
 * De dónde sale un atributo de la línea (RF-CAT-04, ADR 0021): `CATALOGO` = el nombre o la clase lo dicen;
 * `IA_WEB` = se investigó por familia en la web y se revisó, con su fuente.
 */
export type OrigenAtributo = 'CATALOGO' | 'IA_WEB' | 'EQUIPO';

/** Varios valores = el modelo se vende en varias versiones (por ejemplo 4x2 y 4x4). */
export type AtributoCatalogo = Readonly<{
  valores: readonly string[];
  origen: OrigenAtributo;
  fuente: string | null;
}>;

export type AtributosLinea = Readonly<{
  combustible: AtributoCatalogo | null;
  transmision: AtributoCatalogo | null;
  traccion: AtributoCatalogo | null;
}>;

export type LineaCatalogo = Readonly<{
  id: number;
  marcaId: number;
  nombre: string;
  clase: string;
  tipoVehiculo: TipoVehiculo;
  cilindradaCc: number | null;
  potenciaKw: number | null;
  combustible: CombustibleCatalogo | null;
  transmision: TransmisionCatalogo | null;
  traccion: TraccionCatalogo | null;
  puertas: number | null;
  /** Puede faltar si el backend aún no la envía: se arma con los campos de arriba (`atributosDe`). */
  atributos?: AtributosLinea;
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

const delCatalogo = (valor: string | null): AtributoCatalogo | null =>
  valor ? { valores: [valor], origen: 'CATALOGO', fuente: null } : null;

/** Los atributos de la línea; con un backend que aún no envía `atributos`, salen de los campos planos. */
export function atributosDe(linea: LineaCatalogo): AtributosLinea {
  return (
    linea.atributos ?? {
      combustible: delCatalogo(linea.combustible),
      transmision: delCatalogo(linea.transmision),
      traccion: delCatalogo(linea.traccion),
    }
  );
}
