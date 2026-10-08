import { nivelVisual, nombrePieza } from './diagnostico';

describe('diagnóstico', () => {
  test('cada gravedad tiene su color del mockup', () => {
    expect(nivelVisual('CRITICO')).toBe('error');
    expect(nivelVisual('MODERADO')).toBe('alerta');
    expect(nivelVisual('LEVE')).toBe('ok');
  });

  test('las piezas se muestran sin guiones bajos', () => {
    expect(nombrePieza('pastillas_freno')).toBe('Pastillas freno');
  });
});
