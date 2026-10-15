import { configurarSesion, pedir } from './cliente';
import { ErrorApi, ErrorSinConexion, mensajeParaPersona } from './errores';

const fetchSimulado = jest.fn();
const alVencer = jest.fn();

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
    alVencer.mockReset();
    globalThis.fetch = fetchSimulado;
    configurarSesion({ token: async () => 'token-de-prueba', alVencer });
  });

  test('envía el token de la sesión y devuelve el JSON', async () => {
    fetchSimulado.mockResolvedValue(respuestaJson(200, []));

    await expect(pedir('/api/v1/vehiculos')).resolves.toEqual([]);

    const [url, init] = fetchSimulado.mock.calls[0];
    expect(url).toBe('http://192.168.1.10:8080/api/v1/vehiculos');
    expect(new Headers(init.headers).get('Authorization')).toBe('Bearer token-de-prueba');
  });

  test('sin sesión no envía Authorization', async () => {
    configurarSesion({ token: async () => null, alVencer });
    fetchSimulado.mockResolvedValue(respuestaJson(200, []));

    await pedir('/api/v1/vehiculos');

    expect(new Headers(fetchSimulado.mock.calls[0][1].headers).has('Authorization')).toBe(false);
  });

  test('una sesión vencida (401) avisa para cerrar la sesión', async () => {
    fetchSimulado.mockResolvedValue(
      respuestaJson(401, { type: 'https://weveh.co/problemas/no-autenticado', status: 401 }),
    );

    const error = await pedir('/api/v1/vehiculos').catch((e: unknown) => e);

    expect((error as ErrorApi).status).toBe(401);
    expect(alVencer).toHaveBeenCalledTimes(1);
  });

  test('pedir confirmar la identidad no cierra la sesión', async () => {
    fetchSimulado.mockResolvedValue(
      respuestaJson(401, { type: 'https://weveh.co/problemas/identidad-no-confirmada', status: 401 }),
    );

    await pedir('/api/v1/cuenta', { method: 'DELETE' }).catch(() => undefined);

    expect(alVencer).not.toHaveBeenCalled();
  });

  test('un Problem Details se convierte en ErrorApi', async () => {
    fetchSimulado.mockResolvedValue(
      respuestaJson(400, {
        type: 'https://weveh.co/problemas/dato-invalido',
        title: 'Revisa los datos',
        status: 400,
      }),
    );

    const error = await pedir('/api/v1/vehiculos').catch((e: unknown) => e);

    expect(error).toBeInstanceOf(ErrorApi);
    expect((error as ErrorApi).status).toBe(400);
    expect((error as ErrorApi).problema.type).toBe('https://weveh.co/problemas/dato-invalido');
    expect(mensajeParaPersona(error)).toBe('Revisa los datos');
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
