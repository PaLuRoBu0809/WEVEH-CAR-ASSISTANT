import { Platform } from 'react-native';

import { urlDeRetorno } from './urlDeRetorno';

jest.mock('expo-linking', () => ({
  createURL: (ruta: string, opciones?: { queryParams?: Record<string, string> }) =>
    `exp://192.168.1.10:8081/--/${ruta}${opciones?.queryParams ? `?siguiente=${opciones.queryParams.siguiente}` : ''}`,
}));

describe('urlDeRetorno (ADR 0022)', () => {
  afterEach(() => jest.restoreAllMocks());

  test('en el celular vuelve a la app', () => {
    expect(urlDeRetorno('auth/callback')).toBe('exp://192.168.1.10:8081/--/auth/callback');
  });

  test('en la demo web vuelve a la misma página', () => {
    jest.replaceProperty(Platform, 'OS', 'web');
    Object.defineProperty(globalThis, 'window', {
      value: { location: { origin: 'https://weveh-demo.vercel.app' } },
      configurable: true,
    });

    expect(urlDeRetorno('auth/callback')).toBe('https://weveh-demo.vercel.app/auth/callback');
  });
});

describe('urlDeRetorno con destino (RF-CTA-05)', () => {
  afterEach(() => jest.restoreAllMocks());

  test('en el celular pasa el destino a la app', () => {
    expect(urlDeRetorno('auth/callback', { siguiente: '/cuenta/eliminar' })).toBe(
      'exp://192.168.1.10:8081/--/auth/callback?siguiente=/cuenta/eliminar',
    );
  });

  test('en la web agrega el destino a la URL', () => {
    jest.replaceProperty(Platform, 'OS', 'web');
    Object.defineProperty(globalThis, 'window', {
      value: { location: { origin: 'https://weveh-demo.vercel.app' } },
      configurable: true,
    });

    expect(urlDeRetorno('auth/callback', { siguiente: '/cuenta/eliminar' })).toBe(
      'https://weveh-demo.vercel.app/auth/callback?siguiente=%2Fcuenta%2Feliminar',
    );
  });
});
