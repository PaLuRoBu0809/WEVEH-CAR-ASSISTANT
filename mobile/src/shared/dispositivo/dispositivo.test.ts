import * as Crypto from 'expo-crypto';
import * as SecureStore from 'expo-secure-store';

import { LLAVE_DISPOSITIVO, obtenerDispositivoId, olvidarDispositivoEnMemoria } from './dispositivo';

jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(),
  setItemAsync: jest.fn(),
}));
jest.mock('expo-crypto', () => ({
  randomUUID: jest.fn(),
}));

const leer = jest.mocked(SecureStore.getItemAsync);
const guardar = jest.mocked(SecureStore.setItemAsync);
const generar = jest.mocked(Crypto.randomUUID);

const GUARDADO = '3f1c9a2e-8b4d-4f6a-9c1e-2d7b5a0e4c11';
const NUEVO = '9b2d5e7a-1c3f-4a8b-b6d2-0e4f7a9c1b35';

describe('obtenerDispositivoId', () => {
  beforeEach(() => {
    jest.resetAllMocks();
    olvidarDispositivoEnMemoria();
    generar.mockReturnValue(NUEVO);
  });

  test('en el primer arranque genera un UUID v4 y lo guarda', async () => {
    leer.mockResolvedValue(null);

    await expect(obtenerDispositivoId()).resolves.toBe(NUEVO);
    expect(guardar).toHaveBeenCalledWith(LLAVE_DISPOSITIVO, NUEVO);
  });

  test('después reutiliza el guardado', async () => {
    leer.mockResolvedValue(GUARDADO);

    await expect(obtenerDispositivoId()).resolves.toBe(GUARDADO);
    expect(generar).not.toHaveBeenCalled();
    expect(guardar).not.toHaveBeenCalled();
  });

  test('si lo guardado no es UUID v4, genera uno nuevo', async () => {
    leer.mockResolvedValue('dañado');

    await expect(obtenerDispositivoId()).resolves.toBe(NUEVO);
    expect(guardar).toHaveBeenCalledWith(LLAVE_DISPOSITIVO, NUEVO);
  });

  test('lee SecureStore una sola vez aunque lo pidan varias veces', async () => {
    leer.mockResolvedValue(GUARDADO);

    await Promise.all([obtenerDispositivoId(), obtenerDispositivoId()]);
    await obtenerDispositivoId();

    expect(leer).toHaveBeenCalledTimes(1);
  });

  test('si SecureStore falla, el siguiente intento vuelve a leer', async () => {
    leer.mockRejectedValueOnce(new Error('bloqueado')).mockResolvedValueOnce(GUARDADO);

    await expect(obtenerDispositivoId()).rejects.toThrow('bloqueado');
    await expect(obtenerDispositivoId()).resolves.toBe(GUARDADO);
  });
});
