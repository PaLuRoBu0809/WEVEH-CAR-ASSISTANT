import type { Nivel } from '@/shared/design-system';

import type { Plazo } from './plazo';

export type NivelGravedad = 'LEVE' | 'MODERADO' | 'CRITICO';

/** Igual a TarjetaRespuesta del backend (RF-MIA-01 y RF-MIA-08): sin precios; el plazo lo fija el código. */
export type Diagnostico = Readonly<{
  posibleFalla: string;
  nivel: NivelGravedad;
  gravedad: string;
  plazo: Plazo;
  /** "No manejes; llévalo hoy al mecánico", etc. */
  textoPlazo: string;
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
  '¿Cada cuánto cambio el aceite?',
  'Vibra cuando voy rápido',
] as const;

export type RolMensaje = 'PERSONA' | 'MECANICO';

/** Un mensaje de la conversación (RF-MIA-02); la tarjeta solo cuando el mensaje describía un síntoma. */
export type Mensaje = Readonly<{
  rol: RolMensaje;
  texto: string;
  tarjeta: Diagnostico | null;
  creado: string;
}>;

export type ConversacionResumen = Readonly<{ id: string; actualizada: string; primerMensaje: string | null }>;

export type Conversacion = Readonly<{ id: string; mensajes: readonly Mensaje[] }>;

export type RespuestaMecanico = Readonly<{ respuesta: string; tarjeta: Diagnostico | null }>;
