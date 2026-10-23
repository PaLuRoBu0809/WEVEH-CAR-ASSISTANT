import { MutationCache, onlineManager, QueryCache, QueryClient } from '@tanstack/react-query';
import { act, render, screen } from '@testing-library/react-native';

import { AvisoSinConexion } from './AvisoSinConexion';
import { borrarDatosLocales, conectarDetectorDeRed, debeGuardarCambio, debeGuardarConsulta } from './persistencia';
import { haceCuanto } from './tiempo';

const mockRemoveItem = jest.fn();
let mockAlCambiarRed: (estado: { isConnected: boolean | null }) => void;

jest.mock('expo-sqlite/kv-store', () => ({
  __esModule: true,
  default: { getItemAsync: jest.fn(), setItemAsync: jest.fn(), removeItemAsync: (...args: unknown[]) => mockRemoveItem(...args) },
}));
jest.mock('@react-native-community/netinfo', () => ({
  __esModule: true,
  default: {
    addEventListener: (callback: typeof mockAlCambiarRed) => {
      mockAlCambiarRed = callback;
      return () => undefined;
    },
  },
}));

afterEach(() => onlineManager.setOnline(true));

describe('haceCuanto (RNF-04)', () => {
  const AHORA = Date.parse('2026-10-22T15:00:00Z');

  test.each([
    [30 * 1000, 'hace un momento'],
    [5 * 60 * 1000, 'hace 5 min'],
    [3 * 60 * 60 * 1000, 'hace 3 h'],
    [26 * 60 * 60 * 1000, 'hace 1 día'],
    [4 * 24 * 60 * 60 * 1000, 'hace 4 días'],
  ])('%i ms atrás es "%s"', (atras, texto) => {
    expect(haceCuanto(AHORA - atras, AHORA)).toBe(texto);
  });

  test('una hora del futuro cuenta como un momento', () => {
    expect(haceCuanto(AHORA + 5000, AHORA)).toBe('hace un momento');
  });
});

describe('qué se guarda en el celular (ADR 0009)', () => {
  const cliente = new QueryClient();

  function consulta(meta: Record<string, unknown> | undefined, conDatos: boolean) {
    const cache = new QueryCache();
    const q = cache.build(cliente, { queryKey: ['x', Math.random()], meta });
    if (conDatos) {
      q.setData({ ok: true });
    }
    return q as unknown as Parameters<typeof debeGuardarConsulta>[0];
  }

  test('solo las consultas marcadas y con datos', () => {
    expect(debeGuardarConsulta(consulta({ guardarSinRed: true }, true))).toBe(true);
    expect(debeGuardarConsulta(consulta({ guardarSinRed: true }, false))).toBe(false);
    expect(debeGuardarConsulta(consulta(undefined, true))).toBe(false);
  });

  test('solo los cambios marcados que esperan red', () => {
    const cache = new MutationCache();
    type Cambio = Parameters<typeof debeGuardarCambio>[0];
    const esperando = cache.build(cliente, { meta: { guardarSinRed: true } }) as unknown as Cambio;
    esperando.state.isPaused = true;
    const otro = cache.build(cliente, { meta: { guardarSinRed: true } }) as unknown as Cambio;
    const sinMarca = cache.build(cliente, {}) as unknown as Cambio;
    sinMarca.state.isPaused = true;

    expect(debeGuardarCambio(esperando)).toBe(true);
    expect(debeGuardarCambio(otro)).toBe(false);
    expect(debeGuardarCambio(sinMarca)).toBe(false);
  });

  test('al cerrar sesión se borra lo guardado (RNF-26)', async () => {
    await borrarDatosLocales();

    expect(mockRemoveItem).toHaveBeenCalledWith('weveh-ultimo-estado');
  });
});

describe('detector de red', () => {
  test('TanStack Query sigue lo que dice NetInfo', async () => {
    conectarDetectorDeRed();

    await act(async () => mockAlCambiarRed({ isConnected: false }));
    expect(onlineManager.isOnline()).toBe(false);

    await act(async () => mockAlCambiarRed({ isConnected: true }));
    expect(onlineManager.isOnline()).toBe(true);

    // Las demás pruebas cambian la red a mano: sin escucha que las contradiga
    onlineManager.setEventListener(() => undefined);
  });
});

describe('AvisoSinConexion (RNF-04)', () => {
  test('con red no muestra nada', async () => {
    await render(<AvisoSinConexion actualizadoEn={Date.now()} />);

    expect(screen.queryByText(/Sin conexión/)).toBeNull();
  });

  test('sin red dice desde cuándo es lo que se ve', async () => {
    onlineManager.setOnline(false);
    await render(<AvisoSinConexion actualizadoEn={Date.now() - 10 * 60 * 1000} />);

    expect(screen.getByText('Sin conexión · actualizado hace 10 min')).toBeTruthy();
  });

  test('sin red y sin nada guardado solo dice sin conexión', async () => {
    onlineManager.setOnline(false);
    await render(<AvisoSinConexion actualizadoEn={0} />);

    expect(screen.getByText('Sin conexión')).toBeTruthy();
  });
});
