import type { RegistroCompletado, VehiculoResumen } from '@/features/garaje';
import { aFechaIso, aFechaVisible, hoyIso } from '@/shared/fechas';

import { aEntero, FORMULARIO_INICIAL, type Errores, type Formulario } from './formulario';

/**
 * RF-GAR-02b: completar el aceite y los papeles que quedaron para después. Se valida solo lo que la persona escribe:
 * puede completar el SOAT hoy y la revisión otro día.
 */
export function formularioCompletarDesde(v: VehiculoResumen): Formulario {
  return {
    ...FORMULARIO_INICIAL,
    tipo: v.tipo,
    km: String(v.kilometraje),
    aceiteKm: v.aceiteKm === null ? '' : String(v.aceiteKm),
    aceiteFecha: aFechaVisible(v.aceiteFecha),
    soatFecha: aFechaVisible(v.soatFecha),
    rtmAunNoAplica: v.rtmAunNoAplica,
    rtmFecha: aFechaVisible(v.rtmFecha),
    seguroInicio: aFechaVisible(v.seguroInicio),
    seguroEntidad: v.seguroEntidad ?? '',
  };
}

function fechaEscrita(texto: string, hoy: string, campo: string): string | undefined {
  if (!texto.trim()) return undefined;
  const iso = aFechaIso(texto);
  if (!iso) return `Escribe la fecha ${campo} como DD/MM/AAAA`;
  if (iso > hoy) return 'No puede ser una fecha futura';
  return undefined;
}

export function erroresAlCompletar(f: Formulario, ahora: Date = new Date()): Errores {
  const hoy = hoyIso(ahora);
  const errores: Errores = {};
  const escribioAceite = f.aceiteKm.trim() !== '' || f.aceiteFecha.trim() !== '';
  if (!f.aceiteNoSe && escribioAceite) {
    const aceiteKm = aEntero(f.aceiteKm);
    if (aceiteKm === null) errores.aceiteKm = 'Escribe los kilómetros del cambio o marca "No sé"';
    else if (aceiteKm > (aEntero(f.km) ?? 0)) errores.aceiteKm = 'No puede tener más kilómetros que el vehículo hoy';
    errores.aceiteFecha = f.aceiteFecha.trim()
      ? fechaEscrita(f.aceiteFecha, hoy, 'del cambio')
      : 'Escribe la fecha del cambio como DD/MM/AAAA';
  }
  errores.soatFecha = fechaEscrita(f.soatFecha, hoy, 'del SOAT');
  if (!f.rtmAunNoAplica) errores.rtmFecha = fechaEscrita(f.rtmFecha, hoy, 'de la revisión');
  if (f.seguroEntidad.trim() && !f.seguroInicio.trim()) errores.seguroInicio = 'Falta la fecha de inicio del seguro';
  else errores.seguroInicio = fechaEscrita(f.seguroInicio, hoy, 'de inicio del seguro');
  return Object.fromEntries(Object.entries(errores).filter(([, mensaje]) => mensaje)) as Errores;
}

export function aRegistroCompletado(f: Formulario, versionFila: number): RegistroCompletado {
  const conAceite = !f.aceiteNoSe && f.aceiteKm.trim() !== '';
  return {
    aceiteKm: conAceite ? aEntero(f.aceiteKm) : null,
    aceiteFecha: conAceite ? aFechaIso(f.aceiteFecha) : null,
    soatFecha: aFechaIso(f.soatFecha),
    rtmFecha: f.rtmAunNoAplica ? null : aFechaIso(f.rtmFecha),
    rtmAunNoAplica: f.rtmAunNoAplica,
    seguroInicio: aFechaIso(f.seguroInicio),
    seguroEntidad: f.seguroEntidad.trim() || null,
    versionFila,
  };
}
