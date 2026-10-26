import type { NivelGravedad } from './diagnostico';

/** RF-MIA-08: lo fija el código, nunca el modelo. Ordenados de menos a más urgente. */
export type Plazo = 'PROXIMO_SERVICIO' | 'ESTA_SEMANA' | 'HOY' | 'NO_MANEJAR';

/** Causa de la regla de seguridad (RF-MIA-03); BATERIA es la única que no impide manejar. */
export type CausaCritica = 'FRENOS' | 'DIRECCION' | 'TESTIGO_ROJO' | 'TEMPERATURA' | 'ACEITE' | 'HUMO' | 'BATERIA';

const ORDEN: readonly Plazo[] = ['PROXIMO_SERVICIO', 'ESTA_SEMANA', 'HOY', 'NO_MANEJAR'];

/** Igual a Plazo.calcular del backend; vectores en contracts/vectores-plazo.json. */
export function calcularPlazo(gravedad: NivelGravedad, causa: CausaCritica | null, piezaVencida: boolean): Plazo {
  const base: Plazo =
    gravedad === 'LEVE' ? 'PROXIMO_SERVICIO' : gravedad === 'MODERADO' ? 'ESTA_SEMANA' : causa && causa !== 'BATERIA' ? 'NO_MANEJAR' : 'HOY';
  if (!piezaVencida) return base;
  return ORDEN[Math.min(ORDEN.indexOf(base) + 1, ORDEN.length - 1)];
}

/** Las dos preguntas de RF-MIA-01, respondidas desde el plazo. */
export function respuestasDelPlazo(plazo: Plazo): Readonly<{ manejar: string; cuando: string }> {
  switch (plazo) {
    case 'NO_MANEJAR':
      return { manejar: 'No. Detente en un lugar seguro.', cuando: 'Hoy mismo.' };
    case 'HOY':
      return { manejar: 'Sí, con cuidado y solo para llevarlo.', cuando: 'Hoy.' };
    case 'ESTA_SEMANA':
      return { manejar: 'Sí, con cuidado.', cuando: 'Esta semana.' };
    case 'PROXIMO_SERVICIO':
      return { manejar: 'Sí.', cuando: 'En tu próximo servicio.' };
  }
}
