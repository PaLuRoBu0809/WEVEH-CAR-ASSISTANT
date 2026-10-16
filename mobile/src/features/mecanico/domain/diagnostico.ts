import type { Nivel } from '@/shared/design-system';

export type NivelGravedad = 'LEVE' | 'MODERADO' | 'CRITICO';

/** Igual a DiagnosticoRespuesta del backend (contrato v2, RF-MIA-01): sin precio, que se pide aparte. */
export type Diagnostico = Readonly<{
  posibleFalla: string;
  nivel: NivelGravedad;
  gravedad: string;
  /** "¿Por qué importa?": máximo 2 oraciones. */
  porQueImporta: string;
  /** Qué hacer: de 1 a 3 pasos cortos, en orden. */
  pasos: readonly string[];
  requiereRevisionHumana: boolean;
  requiereMecanico: boolean;
  piezasRelacionadas: readonly string[];
  datosFaltantes: readonly string[];
  respuestaSegura: boolean;
  aviso: string;
}>;

/** Colores del mockup: rojo para Crítico, amarillo para Moderado y verde para Leve. */
export function nivelVisual(nivel: NivelGravedad): Nivel {
  if (nivel === 'CRITICO') return 'error';
  if (nivel === 'MODERADO') return 'alerta';
  return 'ok';
}

/** "pastillas_freno" → "Pastillas freno". */
export function nombrePieza(pieza: string): string {
  const texto = pieza.replace(/_/g, ' ').trim();
  return texto.charAt(0).toUpperCase() + texto.slice(1);
}

export const EJEMPLOS = [
  'Suena un chillido al frenar',
  'Se prendió un testigo en el tablero',
  'Gasta más gasolina que antes',
  'Vibra cuando voy rápido',
] as const;
