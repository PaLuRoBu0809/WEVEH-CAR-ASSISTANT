/**
 * Contrato compartido con el backend Spring Boot.
 * Centraliza los niveles de gravedad y los colores del semaforo para que ningun
 * componente escriba "Critico" ni un hexadecimal suelto.
 */

export const NivelGravedad = {
  LEVE: 'Leve',
  MODERADO: 'Moderado',
  CRITICO: 'Crítico',
} as const;

export type NivelGravedad = (typeof NivelGravedad)[keyof typeof NivelGravedad];

export const COLORES_SEMAFORO: Record<NivelGravedad, string> = {
  [NivelGravedad.LEVE]: '#00C781',
  [NivelGravedad.MODERADO]: '#FFC800',
  [NivelGravedad.CRITICO]: '#FF3B30',
};

/** Orden visual del anillo del logotipo: rojo, verde, ambar. */
export const ORDEN_SEGMENTOS_ANILLO: NivelGravedad[] = [
  NivelGravedad.CRITICO,
  NivelGravedad.LEVE,
  NivelGravedad.MODERADO,
];

export const ETIQUETAS_GRAVEDAD: Record<NivelGravedad, string> = {
  [NivelGravedad.LEVE]: 'Puede esperar',
  [NivelGravedad.MODERADO]: 'Revisar pronto',
  [NivelGravedad.CRITICO]: 'Atención inmediata',
};

const COLOR_GRAVEDAD_DESCONOCIDA = '#2D2D30';

export function obtenerColorGravedad(nivel: NivelGravedad | null | undefined): string {
  if (!nivel) return COLOR_GRAVEDAD_DESCONOCIDA;
  return COLORES_SEMAFORO[nivel] ?? COLOR_GRAVEDAD_DESCONOCIDA;
}

export interface DatosVehiculo {
  marca: string;
  modelo: string;
  anio: string;
}

export const VEHICULO_VACIO: DatosVehiculo = {
  marca: '',
  modelo: '',
  anio: '',
};

/** Respuesta del backend: los nombres llegan en snake_case desde Jackson. */
export interface DiagnosticoRecibido {
  posible_falla: string;
  nivel_gravedad: NivelGravedad;
  explicacion_simple: string;
  accion_inmediata: string;
  costo_estimado: string | null;
  requires_human_review: boolean;
  requires_mechanic: boolean;
}

/** Payload de error uniforme de ManejadorGlobalExcepciones. */
export interface ErrorRecibido {
  codigo: string;
  mensaje: string;
  timestamp: string;
}

export const MENSAJES_ERROR = {
  SINTOMA_VACIO: 'Describe primero qué está haciendo tu vehículo.',
  SIN_CONEXION: 'No pudimos contactar al Mecánico IA. Revisa tu conexión e intenta de nuevo.',
  RESPUESTA_INESPERADA: 'El Mecánico IA respondió algo que no pudimos leer. Intenta de nuevo.',
} as const;

export const DISCLAIMER_LEGAL =
  'Esta es una estimación preventiva generada por IA. No reemplaza la revisión de un mecánico presencial.';
