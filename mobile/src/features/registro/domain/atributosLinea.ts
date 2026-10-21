import type { AtributoCatalogo, AtributosLinea, OrigenAtributo } from '@/features/catalogo';
import {
  COMBUSTIBLES,
  TRACCIONES,
  TRANSMISIONES,
  type Combustible,
  type TipoVehiculo,
  type Traccion,
  type Transmision,
} from '@/features/garaje';

/** La persona tocó "No sé": se envía sin dato y el agente lo averigua después (RF-CAT-04). */
export const NO_SE = 'NO_SE';
export type NoSe = typeof NO_SE;

/**
 * Qué hace el registro con cada atributo (RF-CAT-04):
 * - `DATO`: un solo valor conocido; no se pregunta, se muestra con "Corregir".
 * - `ELEGIR_ENTRE`: el modelo se vende en varias versiones; se pregunta solo entre esas, con "No sé".
 * - `PREGUNTAR`: no hay ningún dato; se pregunta con todas las opciones y "No sé", sin ninguna marcada.
 */
export type DecisionAtributo<T extends string> =
  | Readonly<{ modo: 'DATO'; valor: T; origen: OrigenAtributo; fuente: string | null }>
  | Readonly<{ modo: 'ELEGIR_ENTRE'; opciones: readonly T[] }>
  | Readonly<{ modo: 'PREGUNTAR'; opciones: readonly T[] }>;

export type DecisionesAtributos = Readonly<{
  combustible: DecisionAtributo<Combustible>;
  transmision: DecisionAtributo<Transmision>;
  /** `null`: no aplica (motos). */
  traccion: DecisionAtributo<Traccion> | null;
}>;

function decidir<T extends string>(atributo: AtributoCatalogo | null, todas: readonly T[]): DecisionAtributo<T> {
  // Un valor que la app no conoce no se muestra como dato
  const conocidos = todas.filter((valor) => atributo?.valores.includes(valor));
  if (atributo && conocidos.length === 1) {
    return { modo: 'DATO', valor: conocidos[0], origen: atributo.origen, fuente: atributo.fuente };
  }
  if (conocidos.length > 1) return { modo: 'ELEGIR_ENTRE', opciones: conocidos };
  return { modo: 'PREGUNTAR', opciones: todas };
}

const valoresDe = <T extends string>(opciones: readonly Readonly<{ valor: T }>[]): readonly T[] => opciones.map((o) => o.valor);

/** @param atributos los de la línea elegida (`atributosDe`), o `null` si la persona escribió su vehículo a mano */
export function decidirAtributos(atributos: AtributosLinea | null, tipo: TipoVehiculo): DecisionesAtributos {
  return {
    combustible: decidir(atributos?.combustible ?? null, valoresDe(COMBUSTIBLES)),
    transmision: decidir(atributos?.transmision ?? null, valoresDe(TRANSMISIONES)),
    traccion: tipo === 'CARRO' ? decidir(atributos?.traccion ?? null, valoresDe(TRACCIONES)) : null,
  };
}

/** El valor con el que arranca el formulario: solo un dato conocido; lo demás queda sin responder. */
export function valorInicial<T extends string>(decision: DecisionAtributo<T> | null): T | null {
  return decision?.modo === 'DATO' ? decision.valor : null;
}

function dominio(fuente: string): string {
  try {
    return new URL(fuente).hostname.replace(/^www\./, '');
  } catch {
    return fuente;
  }
}

/** "Dato de WEVEH" o, si se investigó en la web, "Dato de WEVEH · según toyota.com.co". */
export function textoOrigen(decision: Extract<DecisionAtributo<string>, { modo: 'DATO' }>): string {
  if (decision.origen === 'IA_WEB' && decision.fuente) return `Dato de WEVEH · según ${dominio(decision.fuente)}`;
  return 'Dato de WEVEH';
}
