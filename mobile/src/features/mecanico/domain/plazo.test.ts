import vectores from '../../../../../contracts/vectores-plazo.json';

import type { NivelGravedad } from './diagnostico';
import { calcularPlazo, respuestasDelPlazo, type CausaCritica, type Plazo } from './plazo';

describe('plazo del Mecánico IA (RF-MIA-08, vectores compartidos)', () => {
  test.each(vectores.vectores.map((v) => [v.caso, v] as const))('%s', (_caso, vector) => {
    const { gravedad, causa, piezaVencida } = vector.entrada;

    expect(calcularPlazo(gravedad as NivelGravedad, causa as CausaCritica | null, piezaVencida)).toBe(vector.esperado.plazo);
  });

  test.each<Plazo>(['NO_MANEJAR', 'HOY', 'ESTA_SEMANA', 'PROXIMO_SERVICIO'])('%s responde las dos preguntas', (plazo) => {
    const { manejar, cuando } = respuestasDelPlazo(plazo);

    expect(manejar.length).toBeGreaterThan(0);
    expect(cuando.length).toBeGreaterThan(0);
  });

  test('no manejar dice que no', () => {
    expect(respuestasDelPlazo('NO_MANEJAR').manejar).toMatch(/^No/);
  });
});
