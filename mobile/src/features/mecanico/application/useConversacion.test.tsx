import { notifyManager, QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react-native';
import type { ReactNode } from 'react';

import { pedir } from '@/shared/http';

import type { Conversacion } from '../domain/diagnostico';
import {
  crearConversacion,
  enviarMensaje,
  listarConversaciones,
  transcribir,
  verConversacion,
} from '../infrastructure/apiMecanico';
import { claveConversacion, useConversacion, useConversaciones, useEnviarMensaje, useTranscribir } from './useConversacion';

jest.mock('@/shared/http', () => ({ pedir: jest.fn() }));
jest.mock('expo-file-system', () => ({ File: jest.fn().mockImplementation((uri: string) => ({ uri })) }));

const mockPedir = jest.mocked(pedir);

function preparar() {
  const cliente = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: Infinity }, mutations: { retry: false, gcTime: Infinity } } });
  const envoltorio = ({ children }: { children: ReactNode }) => <QueryClientProvider client={cliente}>{children}</QueryClientProvider>;
  return { cliente, envoltorio };
}

beforeAll(() => notifyManager.setScheduler((callback) => callback()));
beforeEach(() => mockPedir.mockReset());

describe('API del Mecánico IA (RF-MIA-02, RF-MIA-11)', () => {
  test('cada llamada va a su ruta', async () => {
    mockPedir.mockResolvedValue({});

    await crearConversacion('v1');
    await listarConversaciones('v1');
    await verConversacion('v1', 'c1');
    await enviarMensaje('v1', 'c1', 'hola');

    expect(mockPedir).toHaveBeenNthCalledWith(1, '/api/v1/vehiculos/v1/conversaciones', { method: 'POST' });
    expect(mockPedir).toHaveBeenNthCalledWith(2, '/api/v1/vehiculos/v1/conversaciones');
    expect(mockPedir).toHaveBeenNthCalledWith(3, '/api/v1/vehiculos/v1/conversaciones/c1');
    expect(mockPedir).toHaveBeenNthCalledWith(4, '/api/v1/vehiculos/v1/conversaciones/c1/mensajes', {
      method: 'POST',
      body: JSON.stringify({ texto: 'hola' }),
    });
  });

  test('el audio va como archivo en un FormData', async () => {
    mockPedir.mockResolvedValue({ texto: 'suena un chillido' });

    await expect(transcribir('file:///voz.m4a')).resolves.toEqual({ texto: 'suena un chillido' });

    const [ruta, init] = mockPedir.mock.calls[0];
    expect(ruta).toBe('/api/v1/transcripciones');
    expect(init?.body).toBeInstanceOf(FormData);
  });
});

describe('hooks de la conversación', () => {
  test('lista y abre conversaciones solo con vehículo y conversación', async () => {
    mockPedir.mockImplementation(async (ruta: string) =>
      ruta.endsWith('/c1') ? { id: 'c1', mensajes: [] } : [{ id: 'c1', actualizada: '', primerMensaje: 'hola' }],
    );
    const { envoltorio } = preparar();

    const lista = await renderHook(() => useConversaciones('v1'), { wrapper: envoltorio });
    const una = await renderHook(() => useConversacion('v1', 'c1'), { wrapper: envoltorio });
    const sinConversacion = await renderHook(() => useConversacion('v1', null), { wrapper: envoltorio });

    await waitFor(() => expect(lista.result.current.data).toHaveLength(1));
    await waitFor(() => expect(una.result.current.data?.id).toBe('c1'));
    expect(sinConversacion.result.current.fetchStatus).toBe('idle');
  });

  test('enviar sin conversación la crea y agrega los dos mensajes a la caché', async () => {
    mockPedir.mockImplementation(async (ruta: string) =>
      ruta.endsWith('/mensajes')
        ? { respuesta: 'Podrían ser las pastillas.', tarjeta: null }
        : { id: 'c9', creada: '2026-10-26T10:00:00Z' },
    );
    const { cliente, envoltorio } = preparar();
    const { result } = await renderHook(() => useEnviarMensaje('v1'), { wrapper: envoltorio });

    await act(async () => {
      await result.current.mutateAsync({ conversacionId: null, texto: 'chilla al frenar' });
    });

    const guardada = cliente.getQueryData<Conversacion>(claveConversacion('v1', 'c9'));
    expect(guardada?.mensajes.map((m) => m.rol)).toEqual(['PERSONA', 'MECANICO']);
    expect(guardada?.mensajes[1].texto).toBe('Podrían ser las pastillas.');
  });

  test('enviar en una conversación existente no crea otra', async () => {
    mockPedir.mockResolvedValue({ respuesta: 'Sí.', tarjeta: null });
    const { envoltorio } = preparar();
    const { result } = await renderHook(() => useEnviarMensaje('v1'), { wrapper: envoltorio });

    await act(async () => {
      await result.current.mutateAsync({ conversacionId: 'c1', texto: '¿y el disco?' });
    });

    expect(mockPedir).toHaveBeenCalledTimes(1);
    expect(mockPedir.mock.calls[0][0]).toBe('/api/v1/vehiculos/v1/conversaciones/c1/mensajes');
  });

  test('sin vehículo no envía', async () => {
    const { envoltorio } = preparar();
    const { result } = await renderHook(() => useEnviarMensaje(undefined), { wrapper: envoltorio });

    await act(async () => {
      await expect(result.current.mutateAsync({ conversacionId: null, texto: 'hola' })).rejects.toThrow('Falta el vehículo');
    });
    expect(mockPedir).not.toHaveBeenCalled();
  });

  test('transcribir devuelve el texto', async () => {
    mockPedir.mockResolvedValue({ texto: 'vibra a 80' });
    const { envoltorio } = preparar();
    const { result } = await renderHook(() => useTranscribir(), { wrapper: envoltorio });

    await act(async () => {
      await expect(result.current.mutateAsync('file:///voz.m4a')).resolves.toEqual({ texto: 'vibra a 80' });
    });
  });
});
