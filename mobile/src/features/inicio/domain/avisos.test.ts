import type { VehiculoResumen } from '@/features/garaje';

import { avisosDeInicio, PASOS_REVISAR_ACEITE } from './avisos';

jest.mock('@/features/garaje', () => jest.requireActual('@/features/garaje/domain/vehiculo'));

function vehiculo(id: string, alias: string, datosFaltantes: VehiculoResumen['datosFaltantes']): VehiculoResumen {
  return { id, alias, marca: 'TOYOTA', linea: 'PRADO', datosFaltantes } as unknown as VehiculoResumen;
}

describe('avisos de Inicio (RF-GAR-02b)', () => {
  test('sin datos pendientes no hay avisos', () => {
    expect(avisosDeInicio([vehiculo('1', 'La Prado', [])])).toEqual([]);
  });

  test('la Prado sin SOAT ni RTM avisa que faltan los papeles', () => {
    const [aviso] = avisosDeInicio([vehiculo('1', 'La Prado', ['SOAT', 'RTM'])]);

    expect(aviso.titulo).toBe('Te faltan los papeles de La Prado');
    expect(aviso.detalle).toContain('el SOAT y la revisión técnico-mecánica');
    expect(aviso.guiaAceite).toBe(false);
  });

  test('si falta el aceite se ofrece la guía para revisarlo', () => {
    const [aviso] = avisosDeInicio([vehiculo('1', 'La Prado', ['ACEITE'])]);

    expect(aviso.titulo).toBe('Te falta un dato de La Prado');
    expect(aviso.guiaAceite).toBe(true);
  });

  test('un aviso por cada vehículo que tiene algo pendiente', () => {
    const avisos = avisosDeInicio([
      vehiculo('1', 'La Prado', ['SOAT']),
      vehiculo('2', 'La moto', []),
      vehiculo('3', 'El Spark', ['ACEITE']),
    ]);

    expect(avisos.map((a) => a.vehiculoId)).toEqual(['1', '3']);
  });

  test('la guía del aceite explica nivel y color en pocos pasos', () => {
    expect(PASOS_REVISAR_ACEITE.length).toBeLessThanOrEqual(5);
    expect(PASOS_REVISAR_ACEITE.join(' ')).toContain('lechoso');
  });
});
