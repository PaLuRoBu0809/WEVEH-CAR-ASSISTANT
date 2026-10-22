import { Platform } from 'react-native';

import { urlDeRetorno } from './urlDeRetorno';

jest.mock('expo-linking', () => ({ createURL: (ruta: string) => `exp://192.168.1.10:8081/--/${ruta}` }));

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
