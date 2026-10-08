import { pedir } from './cliente';
import { ErrorApi, ErrorSinConexion, mensajeParaPersona } from './errores';

jest.mock('@/shared/dispositivo', () => ({
  obtenerDispositivoId: jest.fn().mockResolvedValue('3f1c9a2e-8b4d-4f6a-9c1e-2d7b5a0e4c11'),
}));

const fetchSimulado = jest.fn();

function respuestaJson(status: number, cuerpo: unknown): Response {
  return new Response(JSON.stringify(cuerpo), {
    status,
    headers: { 'Content-Type': status >= 400 ? 'application/problem+json' : 'application/json' },
  });
}

describe('pedir', () => {
  beforeEach(() => {
    process.env.EXPO_PUBLIC_API_URL = 'http://192.168.1.10:8080/';
    fetchSimulado.mockReset();
    globalThis.fetch = fetchSimulado;
  });

  test('envía el identificador del dispositivo y devuelve el JSON', async () => {
    fetchSimulado.mockResolvedValue(respuestaJson(200, []));

    await expect(pedir('/api/v1/vehiculos')).resolves.toEqual([]);

    const [url, init] = fetchSimulado.mock.calls[0];
    expect(url).toBe('http://192.168.1.10:8080/api/v1/vehiculos');
    expect(new Headers(init.headers).get('X-Weveh-Dispositivo')).toBe('3f1c9a2e-8b4d-4f6a-9c1e-2d7b5a0e4c11');
  });

  test('un Problem Details se convierte en ErrorApi', async () => {
    fetchSimulado.mockResolvedValue(
      respuestaJson(400, {
        type: 'https://weveh.co/problemas/dispositivo-invalido',
        title: 'Dispositivo no válido',
        status: 400,
      }),
    );

    const error = await pedir('/api/v1/vehiculos').catch((e: unknown) => e);

    expect(error).toBeInstanceOf(ErrorApi);
    expect((error as ErrorApi).status).toBe(400);
    expect((error as ErrorApi).problema.type).toBe('https://weveh.co/problemas/dispositivo-invalido');
    expect(mensajeParaPersona(error)).toBe('Dispositivo no válido');
  });

  test('sin red lanza ErrorSinConexion con un mensaje sin jerga', async () => {
    fetchSimulado.mockRejectedValue(new TypeError('Network request failed'));

    const error = await pedir('/api/v1/vehiculos').catch((e: unknown) => e);

    expect(error).toBeInstanceOf(ErrorSinConexion);
    expect(mensajeParaPersona(error)).toBe('No pudimos conectarnos. Revisa tu internet e inténtalo de nuevo.');
  });

  test('un error del servidor no muestra detalles técnicos', async () => {
    fetchSimulado.mockResolvedValue(new Response('boom', { status: 500 }));

    const error = await pedir('/api/v1/vehiculos').catch((e: unknown) => e);

    expect(mensajeParaPersona(error)).toBe('Tuvimos un problema de nuestro lado. Inténtalo en un momento.');
  });
});
