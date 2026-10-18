import { act, renderHook } from '@testing-library/react-native';

import { useEstadoSesion } from '@/features/cuentas';
import { useVehiculos } from '@/features/garaje';

import { DURACION_ENCENDIDO_MS, useDestinoInicial } from './useDestinoInicial';

jest.mock('@/features/cuentas', () => ({ useEstadoSesion: jest.fn() }));
jest.mock('@/features/garaje', () => ({ useVehiculos: jest.fn() }));

const mockSesion = useEstadoSesion as jest.Mock;
const mockVehiculos = useVehiculos as jest.Mock;

type Consulta = { isPending?: boolean; isError?: boolean; data?: unknown[] };

async function destinoTrasEncendido(sesion: string, consulta: Consulta) {
  mockSesion.mockReturnValue(sesion);
  mockVehiculos.mockReturnValue({ isPending: false, isError: false, data: [], ...consulta });
  const { result } = await renderHook(() => useDestinoInicial());
  await act(async () => jest.advanceTimersByTime(DURACION_ENCENDIDO_MS));
  return result.current;
}

describe('useDestinoInicial', () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  test('espera a que termine la animación de encendido', async () => {
    mockSesion.mockReturnValue('sin-sesion');
    mockVehiculos.mockReturnValue({ isPending: true });

    const { result } = await renderHook(() => useDestinoInicial());
    await act(async () => jest.advanceTimersByTime(DURACION_ENCENDIDO_MS - 1));

    expect(result.current).toBeNull();
  });

  test('sin sesión va a la portada y no pide vehículos', async () => {
    await expect(destinoTrasEncendido('sin-sesion', {})).resolves.toBe('/portada');

    expect(mockVehiculos).toHaveBeenCalledWith(false);
  });

  test('mientras carga la sesión o los vehículos no decide', async () => {
    await expect(destinoTrasEncendido('cargando', {})).resolves.toBeNull();
    await expect(destinoTrasEncendido('con-sesion', { isPending: true })).resolves.toBeNull();
  });

  test('con vehículos va a Inicio', async () => {
    await expect(destinoTrasEncendido('con-sesion', { data: [{ id: 'v1' }] })).resolves.toBe('/inicio');

    expect(mockVehiculos).toHaveBeenCalledWith(true);
  });

  test('con el garaje vacío o sin conexión va al garaje', async () => {
    await expect(destinoTrasEncendido('con-sesion', { data: [] })).resolves.toBe('/garaje');
    await expect(destinoTrasEncendido('con-sesion', { isError: true })).resolves.toBe('/garaje');
  });
});
