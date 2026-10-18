import { notifyManager, QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react-native';
import type { ReactNode } from 'react';

import { buscarLineas, buscarMarcas } from '../infrastructure/apiCatalogo';
import { useLineas, useMarcas, useTextoConEspera } from './useCatalogo';

jest.mock('../infrastructure/apiCatalogo', () => ({ buscarMarcas: jest.fn(), buscarLineas: jest.fn() }));

const mockBuscarMarcas = buscarMarcas as jest.Mock;
const mockBuscarLineas = buscarLineas as jest.Mock;

let consultas: QueryClient;

function envoltorio({ children }: { children: ReactNode }) {
  return <QueryClientProvider client={consultas}>{children}</QueryClientProvider>;
}

beforeAll(() => {
  notifyManager.setScheduler((callback) => callback());
});

beforeEach(() => {
  jest.clearAllMocks();
  consultas = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: Infinity } } });
  mockBuscarMarcas.mockResolvedValue([{ id: 1, nombre: 'TOYOTA' }]);
  mockBuscarLineas.mockResolvedValue([{ id: 7, nombre: 'PRADO' }]);
});

afterEach(() => {
  consultas.clear();
  jest.useRealTimers();
});

describe('useTextoConEspera', () => {
  test('solo entrega el texto cuando la persona deja de escribir', async () => {
    jest.useFakeTimers();
    const { result, rerender } = await renderHook(({ texto }: { texto: string }) => useTextoConEspera(texto, 250), {
      initialProps: { texto: 'to' },
    });

    await rerender({ texto: 'toy' });
    await act(async () => jest.advanceTimersByTime(200));
    await rerender({ texto: 'toyo' });
    await act(async () => jest.advanceTimersByTime(200));
    expect(result.current).toBe('to');

    await act(async () => jest.advanceTimersByTime(50));
    expect(result.current).toBe('toyo');
  });
});

describe('useMarcas', () => {
  test('busca con al menos dos letras', async () => {
    const { result } = await renderHook(() => useMarcas('CARRO', 'to'), { wrapper: envoltorio });

    await waitFor(() => expect(result.current.data).toEqual([{ id: 1, nombre: 'TOYOTA' }]));
    expect(mockBuscarMarcas).toHaveBeenCalledWith('CARRO', 'to');
  });

  test('con una letra o inactivo no consulta', async () => {
    await renderHook(() => useMarcas('CARRO', 't'), { wrapper: envoltorio });
    await renderHook(() => useMarcas('CARRO', 'toyota', false), { wrapper: envoltorio });

    expect(mockBuscarMarcas).not.toHaveBeenCalled();
  });
});

describe('useLineas', () => {
  test('busca las líneas de la marca elegida', async () => {
    const { result } = await renderHook(() => useLineas(1, 'CARRO', ''), { wrapper: envoltorio });

    await waitFor(() => expect(result.current.data).toEqual([{ id: 7, nombre: 'PRADO' }]));
    expect(mockBuscarLineas).toHaveBeenCalledWith(1, 'CARRO', '');
  });

  test('sin marca no consulta', async () => {
    await renderHook(() => useLineas(null, 'CARRO', 'prado'), { wrapper: envoltorio });

    expect(mockBuscarLineas).not.toHaveBeenCalled();
  });
});
