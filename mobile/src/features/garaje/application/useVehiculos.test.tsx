import { notifyManager, onlineManager, QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react-native';
import type { ReactNode } from 'react';

import { hoyIso } from '@/shared/fechas';
import { ErrorApi } from '@/shared/http';

import type { EdicionVehiculo, RegistroCompletado, SolicitudRegistro, VehiculoResumen } from '../domain/vehiculo';
import * as api from '../infrastructure/apiGaraje';
import {
  CLAVE_VEHICULOS,
  nuevoCambioKilometraje,
  pideConfirmacion,
  prepararCambiosSinRed,
  useActualizarKilometraje,
  useCancelarKilometrajeEsperandoRed,
  useCorregirKilometraje,
  useCompletarRegistro,
  useEditarVehiculo,
  useEliminarVehiculo,
  useKilometrajesEsperandoRed,
  useRegistrarVehiculo,
  useVehiculo,
  useVehiculos,
} from './useVehiculos';

jest.mock('@/shared/http', () => {
  const real = jest.requireActual('@/shared/http/errores');
  return { ErrorApi: real.ErrorApi, pedir: jest.fn() };
});

jest.mock('expo-crypto', () => ({ randomUUID: () => 'clave-1' }));

jest.mock('../infrastructure/apiGaraje', () => ({
  listarVehiculos: jest.fn(),
  obtenerVehiculo: jest.fn(),
  registrarVehiculo: jest.fn(),
  editarVehiculo: jest.fn(),
  completarRegistro: jest.fn(),
  corregirKilometraje: jest.fn(),
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

  test('corregir el kilometraje llama a la API y recarga (ADR 0023)', async () => {
    await ejecutar(() => useCorregirKilometraje('v1'), 134000);

    expect(mockApi.corregirKilometraje).toHaveBeenCalledWith('v1', 134000);
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

describe('kilometraje sin red (RF-GAR-06, ADR 0009)', () => {
  const PRADO = { id: 'v1', kilometraje: 190000 } as unknown as VehiculoResumen;

  beforeEach(() => {
    prepararCambiosSinRed(consultas);
    consultas.setQueryData([...CLAVE_VEHICULOS, 'v1'], PRADO);
    consultas.setQueryData(CLAVE_VEHICULOS, [PRADO]);
  });

  afterEach(() => onlineManager.setOnline(true));

  function usar() {
    return renderHook(
      () => ({ actualizar: useActualizarKilometraje('v1'), esperando: useKilometrajesEsperandoRed('v1') }),
      { wrapper: envoltorio },
    );
  }

  const kmEnCache = () => consultas.getQueryData<VehiculoResumen>([...CLAVE_VEHICULOS, 'v1'])?.kilometraje;

  test('con red lo envía con su clave, sin fecha, y recarga', async () => {
    const invalidar = jest.spyOn(consultas, 'invalidateQueries');
    const { result } = await usar();

    await act(async () => {
      await result.current.actualizar.mutateAsync(nuevoCambioKilometraje('v1', 190500, false));
    });

    expect(mockApi.actualizarKilometraje).toHaveBeenCalledWith('v1', 190500, false, { clave: 'clave-1', leidoEn: undefined });
    expect(invalidar).toHaveBeenCalledWith({ queryKey: CLAVE_VEHICULOS });
  });

  test('sin red queda en pausa, se ve de una vez y se envía solo al volver la red, con el día en que se anotó', async () => {
    onlineManager.setOnline(false);
    const { result } = await usar();

    await act(async () => {
      result.current.actualizar.mutate(nuevoCambioKilometraje('v1', 191200, false));
    });

    await waitFor(() => expect(result.current.esperando).toBe(1));
    expect(mockApi.actualizarKilometraje).not.toHaveBeenCalled();
    expect(kmEnCache()).toBe(191200);
    expect(consultas.getQueryData<VehiculoResumen[]>(CLAVE_VEHICULOS)?.[0].kilometraje).toBe(191200);

    await act(async () => {
      onlineManager.setOnline(true);
    });

    await waitFor(() => expect(result.current.esperando).toBe(0));
    expect(mockApi.actualizarKilometraje).toHaveBeenCalledWith('v1', 191200, false, { clave: 'clave-1', leidoEn: hoyIso() });
  });

  test('en pantalla nunca baja, aunque el cambio traiga un número menor', async () => {
    onlineManager.setOnline(false);
    const { result } = await usar();

    await act(async () => {
      result.current.actualizar.mutate(nuevoCambioKilometraje('v1', 150000, false));
    });

    expect(kmEnCache()).toBe(190000);
  });

  test('otro vehículo no cambia', async () => {
    onlineManager.setOnline(false);
    const otro = { id: 'v2', kilometraje: 5000 } as unknown as VehiculoResumen;
    consultas.setQueryData(CLAVE_VEHICULOS, [PRADO, otro]);
    const { result } = await usar();

    await act(async () => {
      result.current.actualizar.mutate(nuevoCambioKilometraje('v1', 191000, false));
    });

    expect(consultas.getQueryData<VehiculoResumen[]>(CLAVE_VEHICULOS)?.[1].kilometraje).toBe(5000);
  });

  test('cancelar un kilometraje que espera red lo quita de la cola y vuelve el número de antes', async () => {
    onlineManager.setOnline(false);
    const { result } = await renderHook(
      () => ({
        actualizar: useActualizarKilometraje('v1'),
        esperando: useKilometrajesEsperandoRed('v1'),
        cancelar: useCancelarKilometrajeEsperandoRed('v1'),
      }),
      { wrapper: envoltorio },
    );

    await act(async () => {
      result.current.actualizar.mutate(nuevoCambioKilometraje('v1', 191200, false));
    });
    await waitFor(() => expect(result.current.esperando).toBe(1));

    await act(async () => {
      result.current.cancelar();
    });

    expect(result.current.esperando).toBe(0);
    expect(kmEnCache()).toBe(190000);
    expect(consultas.getQueryData<VehiculoResumen[]>(CLAVE_VEHICULOS)?.[0].kilometraje).toBe(190000);
    await act(async () => {
      onlineManager.setOnline(true);
    });
    expect(mockApi.actualizarKilometraje).not.toHaveBeenCalled();
  });

  test('cancelar sin nada esperando no cambia nada', async () => {
    const { result } = await renderHook(() => useCancelarKilometrajeEsperandoRed('v1'), { wrapper: envoltorio });

    await act(async () => {
      result.current();
    });

    expect(kmEnCache()).toBe(190000);
  });

  test('sin datos guardados no falla', async () => {
    consultas.removeQueries({ queryKey: CLAVE_VEHICULOS });
    onlineManager.setOnline(false);
    const { result } = await usar();

    await act(async () => {
      result.current.actualizar.mutate(nuevoCambioKilometraje('v1', 191000, false));
    });

    expect(consultas.getQueryData(CLAVE_VEHICULOS)).toBeUndefined();
  });
});
