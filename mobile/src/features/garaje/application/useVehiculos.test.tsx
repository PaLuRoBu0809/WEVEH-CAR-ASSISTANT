import { notifyManager, QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react-native';
import type { ReactNode } from 'react';

import { ErrorApi } from '@/shared/http';

import type { EdicionVehiculo, RegistroCompletado, SolicitudRegistro } from '../domain/vehiculo';
import * as api from '../infrastructure/apiGaraje';
import {
  CLAVE_VEHICULOS,
  pideConfirmacion,
  useActualizarKilometraje,
  useCompletarRegistro,
  useEditarVehiculo,
  useEliminarVehiculo,
  useRegistrarVehiculo,
  useVehiculo,
  useVehiculos,
} from './useVehiculos';

jest.mock('@/shared/http', () => {
  const real = jest.requireActual('@/shared/http/errores');
  return { ErrorApi: real.ErrorApi, pedir: jest.fn() };
});

jest.mock('../infrastructure/apiGaraje', () => ({
  listarVehiculos: jest.fn(),
  obtenerVehiculo: jest.fn(),
  registrarVehiculo: jest.fn(),
  editarVehiculo: jest.fn(),
  completarRegistro: jest.fn(),
  actualizarKilometraje: jest.fn(),
  eliminarVehiculo: jest.fn(),
}));

const mockApi = api as unknown as Record<keyof typeof api, jest.Mock>;
const VEHICULO = { id: 'v1', marca: 'TOYOTA' };

let consultas: QueryClient;

function envoltorio({ children }: { children: ReactNode }) {
  return <QueryClientProvider client={consultas}>{children}</QueryClientProvider>;
}

beforeAll(() => {
  notifyManager.setScheduler((callback) => callback());
});

beforeEach(() => {
  jest.clearAllMocks();
  consultas = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: Infinity }, mutations: { retry: false, gcTime: Infinity } },
  });
  for (const funcion of Object.values(mockApi).filter(jest.isMockFunction)) {
    funcion.mockResolvedValue(VEHICULO);
  }
});

afterEach(() => consultas.clear());

describe('consultas del garaje', () => {
  test('useVehiculos lista los vehículos', async () => {
    mockApi.listarVehiculos.mockResolvedValue([VEHICULO]);

    const { result } = await renderHook(() => useVehiculos(), { wrapper: envoltorio });

    await waitFor(() => expect(result.current.data).toEqual([VEHICULO]));
  });

  test('useVehiculos deshabilitado no llama a la API', async () => {
    const { result } = await renderHook(() => useVehiculos(false), { wrapper: envoltorio });

    expect(result.current.isPending).toBe(true);
    expect(mockApi.listarVehiculos).not.toHaveBeenCalled();
  });

  test('useVehiculo obtiene el detalle por id', async () => {
    const { result } = await renderHook(() => useVehiculo('v1'), { wrapper: envoltorio });

    await waitFor(() => expect(result.current.data).toEqual(VEHICULO));
    expect(mockApi.obtenerVehiculo).toHaveBeenCalledWith('v1');
  });
});

describe('cambios del garaje', () => {
  async function ejecutar<T>(hook: () => { mutateAsync: (datos: T) => Promise<unknown> }, datos: T) {
    const invalidar = jest.spyOn(consultas, 'invalidateQueries');
    const { result } = await renderHook(hook, { wrapper: envoltorio });
    await act(async () => {
      await result.current.mutateAsync(datos);
    });
    expect(invalidar).toHaveBeenCalledWith({ queryKey: CLAVE_VEHICULOS });
  }

  test('registrar llama a la API y recarga la lista', async () => {
    const solicitud = { marca: 'TOYOTA' } as unknown as SolicitudRegistro;

    await ejecutar(() => useRegistrarVehiculo(), solicitud);

    expect(mockApi.registrarVehiculo).toHaveBeenCalledWith(solicitud);
  });

  test('editar llama a la API con el id y recarga', async () => {
    const edicion = { alias: 'La Prado' } as unknown as EdicionVehiculo;

    await ejecutar(() => useEditarVehiculo('v1'), edicion);

    expect(mockApi.editarVehiculo).toHaveBeenCalledWith('v1', edicion);
  });

  test('completar el registro llama a la API con el id y recarga', async () => {
    const registro = { soatFecha: '2026-06-30' } as unknown as RegistroCompletado;

    await ejecutar(() => useCompletarRegistro('v1'), registro);

    expect(mockApi.completarRegistro).toHaveBeenCalledWith('v1', registro);
  });

  test('actualizar el kilometraje manda la confirmación y recarga', async () => {
    await ejecutar(() => useActualizarKilometraje('v1'), { kilometraje: 190500, confirmado: false });

    expect(mockApi.actualizarKilometraje).toHaveBeenCalledWith('v1', 190500, false);
  });

  test('eliminar llama a la API y recarga', async () => {
    await ejecutar(() => useEliminarVehiculo(), 'v1');

    expect(mockApi.eliminarVehiculo).toHaveBeenCalledWith('v1');
  });
});

describe('pideConfirmacion', () => {
  test('solo un 409 confirmacion-requerida pide confirmar', () => {
    const confirmar = new ErrorApi(409, { type: 'https://weveh.co/problemas/confirmacion-requerida' });
    const conflicto = new ErrorApi(409, { type: 'https://weveh.co/problemas/conflicto' });

    expect(pideConfirmacion(confirmar)).toBe(true);
    expect(pideConfirmacion(conflicto)).toBe(false);
    expect(pideConfirmacion(new ErrorApi(409, {}))).toBe(false);
    expect(pideConfirmacion(new Error('otro'))).toBe(false);
  });
});
