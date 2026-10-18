import { pedir } from '@/shared/http';

import { buscarLineas, buscarMarcas } from './apiCatalogo';

jest.mock('@/shared/http', () => ({ pedir: jest.fn().mockResolvedValue([]) }));

const mockPedir = pedir as jest.Mock;

describe('apiCatalogo', () => {
  beforeEach(() => mockPedir.mockClear());

  test('busca marcas por tipo y texto sin espacios sobrantes', async () => {
    await buscarMarcas('CARRO', '  toyo ');

    expect(mockPedir).toHaveBeenCalledWith('/api/v1/catalogo/marcas?tipo=CARRO&q=toyo');
  });

  test('sin texto no manda el parámetro q', async () => {
    await buscarMarcas('MOTO', '   ');

    expect(mockPedir).toHaveBeenCalledWith('/api/v1/catalogo/marcas?tipo=MOTO');
  });

  test('busca líneas de una marca y codifica el texto', async () => {
    await buscarLineas(7, 'CARRO', 'prado vx');

    expect(mockPedir).toHaveBeenCalledWith('/api/v1/catalogo/marcas/7/lineas?tipo=CARRO&q=prado+vx');
  });
});
