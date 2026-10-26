import * as Sentry from '@sentry/react-native';

import { iniciarMonitoreo, limpiarEvento } from './sentry';

jest.mock('@sentry/react-native', () => ({ init: jest.fn() }));

describe('monitoreo con Sentry (ADR 0010, RNF-23)', () => {
  beforeEach(() => jest.clearAllMocks());

  test('sin DSN no se inicia', () => {
    expect(iniciarMonitoreo('')).toBe(false);
    expect(Sentry.init).not.toHaveBeenCalled();
  });

  test('con DSN se inicia sin datos personales ni capturas', () => {
    expect(iniciarMonitoreo('https://clave@o1.ingest.sentry.io/2')).toBe(true);

    expect(Sentry.init).toHaveBeenCalledWith(
      expect.objectContaining({
        dsn: 'https://clave@o1.ingest.sentry.io/2',
        sendDefaultPii: false,
        attachScreenshot: false,
        attachViewHierarchy: false,
      }),
    );
    const { beforeSend } = (Sentry.init as jest.Mock).mock.calls[0][0];
    expect(beforeSend({ user: { email: 'laura@correo.com' } })).toEqual({});
  });

  test('el evento sale sin la persona ni lo que escribió, y con lo técnico', () => {
    const evento = limpiarEvento({
      user: { email: 'laura@correo.com', ip_address: '190.1.2.3' },
      request: { url: '/api/v1/vehiculos', headers: { Authorization: 'Bearer x' }, cookies: 'a=b', data: '{}', query_string: 'q=toy' },
      message: 'falló',
    });

    expect(evento).toEqual({ request: { url: '/api/v1/vehiculos' }, message: 'falló' });
  });

  test('un evento sin petición pasa igual', () => {
    const sinPeticion: { message: string; user?: unknown } = { message: 'x' };

    expect(limpiarEvento(sinPeticion)).toEqual({ message: 'x' });
  });
});
