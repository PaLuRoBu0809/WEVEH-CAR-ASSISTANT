const mockStartAutoRefresh = jest.fn();
const mockStopAutoRefresh = jest.fn();
const mockCreateClient = jest.fn(() => ({
  auth: { startAutoRefresh: mockStartAutoRefresh, stopAutoRefresh: mockStopAutoRefresh },
}));
let mockAlCambiarEstado: (estado: string) => void;

jest.mock('react-native-url-polyfill/auto', () => ({}));
jest.mock('@supabase/supabase-js', () => ({ createClient: mockCreateClient }));
// Object.create conserva el resto de react-native sin evaluar sus módulos perezosos
jest.mock('react-native', () =>
  Object.create(jest.requireActual('react-native'), {
    AppState: {
      value: {
        addEventListener: (_evento: string, callback: (estado: string) => void) => {
          mockAlCambiarEstado = callback;
        },
      },
    },
  }),
);
jest.mock('./almacenSesion', () => ({ almacenSesion: {} }));

const ENTORNO = { ...process.env };

// El módulo lee el entorno al cargarse: se carga de nuevo en cada prueba (import() necesita ESM en Jest)
async function cargar() {
  jest.isolateModules(() => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    require('./supabase');
  });
}

describe('cliente de Supabase', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env = { ...ENTORNO };
    jest.spyOn(console, 'warn').mockImplementation(() => undefined);
  });

  afterAll(() => {
    process.env = ENTORNO;
  });

  test('usa la URL y la llave configuradas y guarda la sesión en el almacén seguro', async () => {
    process.env.EXPO_PUBLIC_SUPABASE_URL = 'https://proyecto.supabase.co';
    process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_123';

    await cargar();

    expect(mockCreateClient).toHaveBeenCalledWith(
      'https://proyecto.supabase.co',
      'sb_publishable_123',
      expect.objectContaining({
        auth: expect.objectContaining({ persistSession: true, detectSessionInUrl: false, flowType: 'pkce' }),
      }),
    );
    expect(console.warn).not.toHaveBeenCalled();
  });

  test('sin configuración avisa y usa un placeholder en vez de tumbar la app', async () => {
    delete process.env.EXPO_PUBLIC_SUPABASE_URL;
    delete process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

    await cargar();

    expect(console.warn).toHaveBeenCalled();
    expect(mockCreateClient).toHaveBeenCalledWith(
      'https://placeholder.supabase.co',
      'placeholder-sin-configurar',
      expect.anything(),
    );
  });

  test('renueva el token solo mientras la app está activa', async () => {
    await cargar();

    mockAlCambiarEstado('active');
    expect(mockStartAutoRefresh).toHaveBeenCalledTimes(1);

    mockAlCambiarEstado('background');
    expect(mockStopAutoRefresh).toHaveBeenCalledTimes(1);
  });
});
