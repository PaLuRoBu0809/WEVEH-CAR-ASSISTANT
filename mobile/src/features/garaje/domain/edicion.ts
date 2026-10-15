import { aFechaIso, aFechaVisible, hoyIso } from '@/shared/fechas';

import type { EdicionVehiculo, UsoVehiculo, VehiculoResumen } from './vehiculo';

/**
 * RF-GAR-03: formulario para corregir los datos del vehículo. Los textos de error son los que ve la persona.
 */
export type FormularioEdicion = Readonly<{
  alias: string;
  placa: string;
  uso: UsoVehiculo;
  kmMes: string;
  fechaMatricula: string;
}>;

export type ErroresEdicion = Partial<Record<keyof FormularioEdicion, string>>;

const KM_MES_MAXIMO = 20_000;
const PLACA = /^[A-Z0-9]{5,7}$/;
const KM_MAXIMO = 2_000_000;

/** Solo dígitos: acepta "190.000" o "190 000". */
export function aEntero(texto: string): number | null {
  const digitos = texto.replace(/[.\s,]/g, '');
  return /^\d+$/.test(digitos) ? Number(digitos) : null;
}

const normalizarPlaca = (placa: string) => placa.replace(/[\s-]/g, '').toUpperCase();

export function formularioDesde(vehiculo: VehiculoResumen): FormularioEdicion {
  return {
    alias: vehiculo.alias ?? '',
    placa: vehiculo.placa ?? '',
    uso: vehiculo.uso,
    kmMes: String(vehiculo.kmPromedioMes),
    fechaMatricula: aFechaVisible(vehiculo.fechaMatricula),
  };
}

export function erroresEdicion(f: FormularioEdicion, ahora: Date = new Date()): ErroresEdicion {
  const errores: ErroresEdicion = {};
  if (f.placa.trim() && !PLACA.test(normalizarPlaca(f.placa))) {
    errores.placa = 'La placa tiene 5 a 7 letras o números, por ejemplo ABC123';
  }
  const kmMes = aEntero(f.kmMes);
  if (kmMes === null || kmMes > KM_MES_MAXIMO) {
    errores.kmMes = 'Escribe un número entre 0 y 20.000';
  }
  if (f.fechaMatricula.trim()) {
    const iso = aFechaIso(f.fechaMatricula);
    if (!iso) errores.fechaMatricula = 'Escribe la fecha de matrícula como DD/MM/AAAA';
    else if (iso > hoyIso(ahora)) errores.fechaMatricula = 'No puede ser una fecha futura';
  }
  return errores;
}

export function aEdicion(f: FormularioEdicion, versionFila: number): EdicionVehiculo {
  return {
    alias: f.alias.trim() || null,
    placa: f.placa.trim() ? normalizarPlaca(f.placa) : null,
    uso: f.uso,
    kmPromedioMes: aEntero(f.kmMes) ?? 0,
    fechaMatricula: f.fechaMatricula.trim() ? aFechaIso(f.fechaMatricula) : null,
    versionFila,
  };
}

/** RF-GAR-05 en la app: solo el formato; que no baje y los saltos raros los decide el backend. */
export function errorKilometraje(texto: string): string | undefined {
  const km = aEntero(texto);
  if (km === null) return 'Escribe los kilómetros del tablero';
  if (km > KM_MAXIMO) return 'El kilometraje no puede pasar de 2.000.000 km';
  return undefined;
}
