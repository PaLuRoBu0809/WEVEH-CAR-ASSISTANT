import type { AtributosLinea } from '@/features/catalogo';
import type {
  Combustible,
  SolicitudRegistro,
  TipoVehiculo,
  Traccion,
  Transmision,
  UsoVehiculo,
} from '@/features/garaje';

import { aFechaIso, hoyIso } from '@/shared/fechas';

import { NO_SE, type NoSe } from './atributosLinea';

/**
 * Registro básico por pasos (skill dominio-vehiculo §1). Cada paso completo enciende una W.
 * Los textos de error son los que ve la persona: sin jerga.
 */
export type Formulario = {
  tipo: TipoVehiculo;
  marcaId: number | null;
  marca: string;
  catalogoLineaId: number | null;
  linea: string;
  cilindradaCc: number | null;
  manual: boolean;
  /** Lo que el catálogo sabe de la línea elegida; decide qué se pregunta (RF-CAT-04). */
  atributosLinea: AtributosLinea | null;
  anio: string;
  /** `null` = sin responder; `NO_SE` = la persona tocó "No sé". Los dos se envían sin dato (RF-CAT-04). */
  combustible: Combustible | NoSe | null;
  transmision: Transmision | NoSe | null;
  traccion: Traccion | NoSe | null;
  km: string;
  /** RF-GAR-02: no se preguntan en el registro; quedan "Mixto" y 1.000 hasta que la persona los cambie. */
  uso: UsoVehiculo;
  kmMes: string;
  aceiteNoSe: boolean;
  /** RF-GAR-02: tocó "Lo agrego después" en el paso del aceite. */
  aceiteDespues: boolean;
  aceiteKm: string;
  aceiteFecha: string;
  soatFecha: string;
  /** RF-GAR-02: tocó "Lo agrego después" en el paso de los papeles. */
  papelesDespues: boolean;
  rtmAunNoAplica: boolean;
  rtmFecha: string;
  fechaMatricula: string;
  seguroInicio: string;
  seguroEntidad: string;
  alias: string;
  placa: string;
};

export const FORMULARIO_INICIAL: Formulario = {
  tipo: 'CARRO',
  marcaId: null,
  marca: '',
  catalogoLineaId: null,
  linea: '',
  cilindradaCc: null,
  manual: false,
  atributosLinea: null,
  anio: '',
  combustible: null,
  transmision: null,
  traccion: null,
  km: '',
  uso: 'MIXTO',
  kmMes: '1000',
  aceiteNoSe: false,
  aceiteDespues: false,
  aceiteKm: '',
  aceiteFecha: '',
  soatFecha: '',
  papelesDespues: false,
  rtmAunNoAplica: false,
  rtmFecha: '',
  fechaMatricula: '',
  seguroInicio: '',
  seguroEntidad: '',
  alias: '',
  placa: '',
};

/** Pasos que se pueden dejar para después (RF-GAR-02: obligatorios solo el vehículo y el kilometraje). */
export const PASO_ACEITE = 2;
export const PASO_PAPELES = 3;

export const PASOS = [
  { titulo: 'Tu vehículo', bajada: 'Búscalo como aparece en la tarjeta de propiedad.' },
  { titulo: 'Cómo está hoy', bajada: 'Mira el tablero: con eso calculamos qué le toca.' },
  { titulo: 'Lo último que le hiciste', bajada: 'El último cambio de aceite. Si no lo tienes a mano, agrégalo después.' },
  { titulo: 'Papeles', bajada: 'Pon cuándo los sacaste; nosotros calculamos cuándo vencen. También puedes hacerlo después.' },
  { titulo: 'Cómo lo llamas', bajada: 'Opcional: un nombre para reconocerlo y la placa.' },
] as const;

export type Errores = Partial<Record<keyof Formulario, string>>;

/** Solo dígitos: acepta "190.000" o "190 000". */
export function aEntero(texto: string): number | null {
  const digitos = texto.replace(/[.\s,]/g, '');
  if (!/^\d+$/.test(digitos)) return null;
  return Number(digitos);
}

function fechaPasada(texto: string, hoy: string, campo: string): string | undefined {
  const iso = aFechaIso(texto);
  if (!iso) return `Escribe la fecha ${campo} como DD/MM/AAAA`;
  if (iso > hoy) return 'No puede ser una fecha futura';
  return undefined;
}

export function erroresDelPaso(paso: number, f: Formulario, ahora: Date = new Date()): Errores {
  const hoy = hoyIso(ahora);
  const errores: Errores = {};
  if (paso === 0) {
    if (!f.marca.trim()) errores.marca = 'Elige o escribe la marca';
    if (!f.linea.trim()) errores.linea = 'Elige o escribe la línea';
    const anio = aEntero(f.anio);
    const maximo = ahora.getFullYear() + 1;
    if (anio === null || anio < 1950 || anio > maximo) errores.anio = `El año modelo va de 1950 a ${maximo}`;
  }
  if (paso === 1) {
    const km = aEntero(f.km);
    if (km === null) errores.km = 'Escribe los kilómetros del tablero';
    else if (km > 2_000_000) errores.km = 'El kilometraje no puede pasar de 2.000.000 km';
  }
  if (paso === PASO_ACEITE && !f.aceiteNoSe && !f.aceiteDespues) {
    const aceiteKm = aEntero(f.aceiteKm);
    const km = aEntero(f.km) ?? 0;
    if (aceiteKm === null) errores.aceiteKm = 'Escribe los kilómetros o marca "No sé"';
    else if (aceiteKm > km) errores.aceiteKm = 'No puede tener más kilómetros que el vehículo hoy';
    const fecha = fechaPasada(f.aceiteFecha, hoy, 'del cambio');
    if (fecha) errores.aceiteFecha = fecha;
  }
  if (paso === PASO_PAPELES && !f.papelesDespues) {
    const soat = fechaPasada(f.soatFecha, hoy, 'del SOAT');
    if (soat) errores.soatFecha = soat;
    if (!f.rtmAunNoAplica) {
      const rtm = fechaPasada(f.rtmFecha, hoy, 'de la revisión');
      if (rtm) errores.rtmFecha = rtm;
    }
    if (f.fechaMatricula.trim()) {
      const matricula = fechaPasada(f.fechaMatricula, hoy, 'de matrícula');
      if (matricula) errores.fechaMatricula = matricula;
    }
    if (f.seguroInicio.trim() || f.seguroEntidad.trim()) {
      const seguro = fechaPasada(f.seguroInicio, hoy, 'de inicio del seguro');
      if (seguro) errores.seguroInicio = seguro;
    }
  }
  if (paso === 4 && f.placa.trim()) {
    const placa = f.placa.replace(/[\s-]/g, '').toUpperCase();
    if (!/^[A-Z0-9]{5,7}$/.test(placa)) errores.placa = 'La placa tiene 5 a 7 letras o números, por ejemplo ABC123';
  }
  return errores;
}

export function pasoCompleto(paso: number, f: Formulario, ahora?: Date): boolean {
  return Object.keys(erroresDelPaso(paso, f, ahora)).length === 0;
}

const opcional = (texto: string): string | null => (texto.trim() ? texto.trim() : null);

const sinNoSe = <T extends string>(valor: T | NoSe | null): T | null => (valor === NO_SE ? null : valor);

export function aSolicitud(f: Formulario): SolicitudRegistro {
  const aceiteConocido = !f.aceiteNoSe && !f.aceiteDespues;
  const papeles = !f.papelesDespues;
  return {
    tipo: f.tipo,
    catalogoLineaId: f.manual ? null : f.catalogoLineaId,
    marca: f.marca.trim(),
    linea: f.linea.trim(),
    cilindradaCc: f.cilindradaCc,
    anioModelo: aEntero(f.anio) ?? 0,
    combustible: sinNoSe(f.combustible),
    transmision: sinNoSe(f.transmision),
    traccion: f.tipo === 'CARRO' ? sinNoSe(f.traccion) : null,
    kilometraje: aEntero(f.km) ?? 0,
    uso: f.uso,
    kmPromedioMes: aEntero(f.kmMes) ?? 1000,
    aceiteKm: aceiteConocido ? aEntero(f.aceiteKm) : null,
    aceiteFecha: aceiteConocido ? aFechaIso(f.aceiteFecha) : null,
    soatFecha: papeles ? aFechaIso(f.soatFecha) : null,
    rtmFecha: papeles && !f.rtmAunNoAplica ? aFechaIso(f.rtmFecha) : null,
    rtmAunNoAplica: papeles && f.rtmAunNoAplica,
    fechaMatricula: papeles && f.fechaMatricula.trim() ? aFechaIso(f.fechaMatricula) : null,
    seguroInicio: papeles && f.seguroInicio.trim() ? aFechaIso(f.seguroInicio) : null,
    seguroEntidad: papeles ? opcional(f.seguroEntidad) : null,
    alias: opcional(f.alias),
    placa: opcional(f.placa),
  };
}
