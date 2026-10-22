/**
 * Reglas de "Mis datos" (RF-DAT-04 a 07, RF-CTA-05 y 07). Los textos son los que ve la persona.
 */
import { esCorreoValido } from './formularios';

/** El backend guarda el nombre con 1 a 80 caracteres (V5__cuentas.sql). */
export const LARGO_MAXIMO_NOMBRE = 80;

/** Lo que hay que escribir para habilitar "Eliminar mi cuenta". */
export const PALABRA_ELIMINAR = 'ELIMINAR';

/**
 * El backend pide una sesión de máximo 5 minutos para eliminar la cuenta (CuentasServicio.SESION_RECIENTE). La app
 * pide confirmar la identidad un minuto antes, para que no venza en el camino.
 */
export const SEGUNDOS_SESION_RECIENTE = 4 * 60;

/** Rutas a las que puede volver la persona después de confirmar su identidad con Google en la web. */
const DESTINOS_PERMITIDOS = ['/cuenta/eliminar', '/cuenta/correo'] as const;

export function errorNombre(nombre: string): string | undefined {
  const limpio = nombre.trim();
  if (!limpio) {
    return 'Escribe tu nombre';
  }
  return limpio.length > LARGO_MAXIMO_NOMBRE ? `Usa máximo ${LARGO_MAXIMO_NOMBRE} caracteres` : undefined;
}

/** Un campo vacío no muestra error mientras la persona no lo ha llenado. */
export function errorCorreoNuevo(nuevo: string, actual: string | undefined): string | undefined {
  const limpio = nuevo.trim();
  if (!limpio) {
    return undefined;
  }
  if (!esCorreoValido(limpio)) {
    return 'Revisa el correo: falta algo como @correo.com';
  }
  return limpio.toLowerCase() === actual?.trim().toLowerCase() ? 'Ese ya es tu correo' : undefined;
}

export function puedeCambiarCorreo(nuevo: string, actual: string | undefined): boolean {
  return nuevo.trim().length > 0 && errorCorreoNuevo(nuevo, actual) === undefined;
}

export function confirmaEliminar(texto: string): boolean {
  return texto.trim().toUpperCase() === PALABRA_ELIMINAR;
}

/** @param emitidoEn el "iat" del token de Supabase, en segundos */
export function esSesionReciente(emitidoEn: number | undefined, ahoraMs: number): boolean {
  if (emitidoEn === undefined) {
    return false;
  }
  return ahoraMs / 1000 - emitidoEn <= SEGUNDOS_SESION_RECIENTE;
}

/** Evita que la vuelta de Google lleve a cualquier dirección: solo a las pantallas de la cuenta. */
export function destinoSeguro(destino: string | undefined): string | undefined {
  return DESTINOS_PERMITIDOS.find((permitido) => permitido === destino);
}

const MESES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'] as const;

/** "2026-10-21T15:00:00Z" → "21 oct 2026", en la hora de Colombia (UTC−5, sin horario de verano). */
export function fechaLegible(iso: string): string {
  const fecha = new Date(Date.parse(iso) - 5 * 60 * 60 * 1000);
  if (Number.isNaN(fecha.getTime())) {
    return iso;
  }
  return `${fecha.getUTCDate()} ${MESES[fecha.getUTCMonth()]} ${fecha.getUTCFullYear()}`;
}

const MEDIOS: Readonly<Record<string, string>> = {
  APP_REGISTRO: 'al crear tu cuenta',
  APP_GOOGLE: 'al entrar con Google',
  APP_NUEVA_VERSION: 'al aceptar una versión nueva',
};

export function textoMedio(medio: string): string {
  return MEDIOS[medio] ?? 'en la app';
}

/** RF-DAT-04: qué datos personales tiene WEVEH y para qué (resumen de docs/legal, sección 2 y 3). */
export const DATOS_QUE_GUARDAMOS: readonly Readonly<{ dato: string; para: string }>[] = [
  { dato: 'Tu nombre y tu correo', para: 'Tener tu cuenta, entrar y avisarte.' },
  {
    dato: 'Los datos de tus vehículos',
    para: 'Calcular tu plan de mantenimiento y los vencimientos. La placa y el alias son opcionales.',
  },
  {
    dato: 'Tus preguntas al Mecánico IA',
    para: 'Responderte con el contexto de tu vehículo. Al modelo nunca le llega tu nombre, correo ni placa.',
  },
  { dato: 'Las fotos que subas', para: 'Guardarlas como respaldo de tus servicios. Solo tú las ves.' },
];

export const DATOS_QUE_NO_GUARDAMOS = 'No guardamos tu cédula, teléfono, ubicación ni datos de pago.';
