import { saludo } from './PantallaInicio';

jest.mock('@/features/garaje', () => ({ useVehiculos: jest.fn() }));

describe('saludo', () => {
  test.each([
    [6, 'Buenos días'],
    [11, 'Buenos días'],
    [12, 'Buenas tardes'],
    [18, 'Buenas tardes'],
    [19, 'Buenas noches'],
    [23, 'Buenas noches'],
  ])('a las %i horas dice "%s"', (hora, esperado) => {
    expect(saludo(new Date(2026, 9, 8, hora, 0))).toBe(esperado);
  });
});
