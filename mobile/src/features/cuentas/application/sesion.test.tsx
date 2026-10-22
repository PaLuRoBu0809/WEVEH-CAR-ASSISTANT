import { notifyManager, QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react-native';
import type { ReactNode } from 'react';

import { configurarSesion, ErrorApi } from '@/shared/http';

import { openAuthSessionAsync } from 'expo-web-browser';

import { crearPerfil, obtenerCuenta } from '../infrastructure/apiCuenta';
import { supabase } from '../infrastructure/supabase';
import {
  CLAVE_CUENTA,
  useCerrarSesion,
  useCrearCuenta,
  useCuenta,
  useEstadoSesion,
  useAceptarPolitica,
  useEntradaDesdeEnlace,
  useEntrarConGoogle,
  useFaltaPerfil,
  useIniciarSesion,
  usePrepararSesion,
} from './sesion';

jest.mock('@/shared/http', () => {
  const real = jest.requireActual('@/shared/http/errores');
  return { ErrorApi: real.ErrorApi, configurarSesion: jest.fn(), pedir: jest.fn() };
});

jest.mock('../infrastructure/apiCuenta', () => ({ obtenerCuenta: jest.fn(), crearPerfil: jest.fn() }));

jest.mock('../infrastructure/supabase', () => ({
  supabase: {
    auth: {
      getSession: jest.fn(),
      onAuthStateChange: jest.fn(),
      signUp: jest.fn(),
      signInWithPassword: jest.fn(),
      signInWithOAuth: jest.fn(),
      exchangeCodeForSession: jest.fn(),
      signOut: jest.fn(),
    },
  },
}));

jest.mock('../infrastructure/urlDeRetorno', () => ({ urlDeRetorno: (ruta: string) => `weveh://${ruta}` }));

jest.mock('expo-web-browser', () => ({ openAuthSessionAsync: jest.fn() }));

const auth = supabase.auth as unknown as Record<string, jest.Mock>;
const mockObtenerCuenta = obtenerCuenta as jest.Mock;
const mockCrearPerfil = crearPerfil as jest.Mock;
const mockAbrirVentana = openAuthSessionAsync as jest.Mock;

const CUENTA = { nombre: 'Ana', correo: 'ana@correo.co', consentimientos: [] };
const DATOS = { nombre: ' Ana ', correo: ' ana@correo.co ', contrasena: 'secreta123', aceptaPolitica: true };
const USUARIO_CON_POLITICA = {
  id: 'u1',
  identities: [{}],
  user_metadata: { nombre: 'Ana', version_politica: '0.1-borrador', politica_aceptada_en: '2026-10-01T00:00:00Z' },
};
const USUARIO_GOOGLE = {
  id: 'u2',
  email: 'laura@gmail.com',
  identities: [{}],
  app_metadata: { provider: 'google' },
  user_metadata: { full_name: 'Laura Gómez', name: 'Laura' },
};
const NO_ENCONTRADO = new ErrorApi(404, { title: 'No existe' });

function conSesionDe(usuario: unknown) {
  auth.getSession.mockResolvedValue({ data: { session: { access_token: 't', user: usuario } } });
}

let consultas: QueryClient;

function envoltorio({ children }: { children: ReactNode }) {
  return <QueryClientProvider client={consultas}>{children}</QueryClientProvider>;
}

let alCambiarSesion: (evento: string, sesion: unknown) => void;
const desuscribir = jest.fn();

beforeEach(() => {
  jest.clearAllMocks();
  consultas = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: Infinity }, mutations: { retry: false, gcTime: Infinity } },
  });
  auth.signOut.mockResolvedValue({ error: null });
  auth.onAuthStateChange.mockImplementation((callback) => {
    alCambiarSesion = callback;
    return { data: { subscription: { unsubscribe: desuscribir } } };
  });
});

beforeAll(() => {
  // Las notificaciones de React Query se aplican en el mismo tick, dentro del act de cada prueba
  notifyManager.setScheduler((callback) => callback());
});

afterEach(() => consultas.clear());

describe('usePrepararSesion', () => {
  test('con sesión guardada queda con-sesion y sigue los cambios de Supabase', async () => {
    auth.getSession.mockResolvedValue({ data: { session: { access_token: 'tok' } } });

    const { result, unmount } = await renderHook(() => usePrepararSesion(), { wrapper: envoltorio });

    await waitFor(() => expect(result.current).toBe('con-sesion'));
    await act(async () => alCambiarSesion('SIGNED_OUT', null));
    expect(result.current).toBe('sin-sesion');

    await unmount();
    expect(desuscribir).toHaveBeenCalled();
  });

  test('si leer la sesión falla queda sin-sesion', async () => {
    auth.getSession.mockRejectedValue(new Error('almacén dañado'));

    const { result } = await renderHook(() => usePrepararSesion(), { wrapper: envoltorio });

    await waitFor(() => expect(result.current).toBe('sin-sesion'));
  });

  test('el cliente HTTP usa el token de Supabase y un 401 cierra la sesión local', async () => {
    auth.getSession.mockResolvedValue({ data: { session: { access_token: 'tok' } } });
    await renderHook(() => usePrepararSesion(), { wrapper: envoltorio });

    const { token, alVencer } = (configurarSesion as jest.Mock).mock.calls[0][0];
    await expect(token()).resolves.toBe('tok');
    auth.getSession.mockResolvedValue({ data: { session: null } });
    await expect(token()).resolves.toBeNull();

    alVencer();
    expect(auth.signOut).toHaveBeenCalledWith({ scope: 'local' });
  });
});

describe('useCuenta', () => {
  test('solo pide la cuenta cuando hay sesión', async () => {
    auth.getSession.mockResolvedValue({ data: { session: { access_token: 'tok' } } });
    mockObtenerCuenta.mockResolvedValue(CUENTA);
    await renderHook(() => usePrepararSesion(), { wrapper: envoltorio });

    const { result } = await renderHook(() => ({ cuenta: useCuenta(), estado: useEstadoSesion() }), {
      wrapper: envoltorio,
    });

    await waitFor(() => expect(result.current.cuenta.data).toEqual(CUENTA));
    expect(result.current.estado).toBe('con-sesion');
  });
});

describe('useCrearCuenta', () => {
  test('envía los datos limpios y la política, y pide verificar el correo cuando no hay sesión', async () => {
    auth.signUp.mockResolvedValue({ data: { user: USUARIO_CON_POLITICA, session: null }, error: null });
    const { result } = await renderHook(() => useCrearCuenta(), { wrapper: envoltorio });

    let resultado: unknown;
    await act(async () => {
      resultado = await result.current.mutateAsync(DATOS);
    });

    expect(resultado).toEqual({ requiereVerificarCorreo: true, correo: 'ana@correo.co' });
    const enviado = auth.signUp.mock.calls[0][0];
    expect(enviado.email).toBe('ana@correo.co');
    expect(enviado.options.data).toMatchObject({ nombre: 'Ana', version_politica: '0.1-borrador' });
    expect(mockCrearPerfil).not.toHaveBeenCalled();
  });

  test('con sesión inmediata crea el perfil en WEVEH', async () => {
    auth.signUp.mockResolvedValue({ data: { user: USUARIO_CON_POLITICA, session: { access_token: 't' } }, error: null });
    mockObtenerCuenta.mockRejectedValue(NO_ENCONTRADO);
    mockCrearPerfil.mockResolvedValue(CUENTA);
    const { result } = await renderHook(() => useCrearCuenta(), { wrapper: envoltorio });

    await act(async () => {
      await expect(result.current.mutateAsync(DATOS)).resolves.toEqual({
        requiereVerificarCorreo: false,
        correo: 'ana@correo.co',
      });
    });

    expect(mockCrearPerfil).toHaveBeenCalledWith({
      nombre: 'Ana',
      versionPolitica: '0.1-borrador',
      aceptadoEn: '2026-10-01T00:00:00Z',
      medio: 'APP_REGISTRO',
    });
  });

  test('un usuario sin identidades significa que el correo ya existía', async () => {
    auth.signUp.mockResolvedValue({ data: { user: { ...USUARIO_CON_POLITICA, identities: [] }, session: null }, error: null });
    const { result } = await renderHook(() => useCrearCuenta(), { wrapper: envoltorio });

    await act(async () => {
      await expect(result.current.mutateAsync(DATOS)).rejects.toThrow('Ya existe una cuenta con ese correo');
    });
  });

  test('traduce el error de Supabase', async () => {
    auth.signUp.mockResolvedValue({ data: { user: null, session: null }, error: { code: 'weak_password', message: 'x' } });
    const { result } = await renderHook(() => useCrearCuenta(), { wrapper: envoltorio });

    await act(async () => {
      await expect(result.current.mutateAsync(DATOS)).rejects.toThrow('muy fácil de adivinar');
    });
  });
});

describe('useIniciarSesion', () => {
  async function iniciar() {
    const { result } = await renderHook(() => useIniciarSesion(), { wrapper: envoltorio });
    let promesa!: Promise<unknown>;
    await act(async () => {
      promesa = result.current.mutateAsync({ correo: ' ana@correo.co ', contrasena: 'secreta123' });
      await promesa.catch(() => undefined);
    });
    return promesa;
  }

  test('con perfil existente guarda la cuenta en caché', async () => {
    auth.signInWithPassword.mockResolvedValue({ data: { user: USUARIO_CON_POLITICA }, error: null });
    mockObtenerCuenta.mockResolvedValue(CUENTA);

    await expect(iniciar()).resolves.toEqual({ tipo: 'lista', cuenta: CUENTA });

    expect(auth.signInWithPassword).toHaveBeenCalledWith({ email: 'ana@correo.co', password: 'secreta123' });
    expect(consultas.getQueryData(CLAVE_CUENTA)).toEqual(CUENTA);
  });

  test('la primera vez crea el perfil con nombre por defecto si no hay nombre', async () => {
    const usuario = { ...USUARIO_CON_POLITICA, user_metadata: { version_politica: '0.1-borrador' } };
    auth.signInWithPassword.mockResolvedValue({ data: { user: usuario }, error: null });
    mockObtenerCuenta.mockRejectedValue(NO_ENCONTRADO);
    mockCrearPerfil.mockResolvedValue(CUENTA);

    await expect(iniciar()).resolves.toEqual({ tipo: 'lista', cuenta: CUENTA });

    expect(mockCrearPerfil).toHaveBeenCalledWith({
      nombre: 'Sin nombre',
      versionPolitica: '0.1-borrador',
      aceptadoEn: undefined,
      medio: 'APP_REGISTRO',
    });
  });

  test('sin política aceptada no crea el perfil y lleva a "Antes de entrar" con la sesión abierta', async () => {
    auth.signInWithPassword.mockResolvedValue({ data: { user: { ...USUARIO_CON_POLITICA, user_metadata: {} } }, error: null });
    mockObtenerCuenta.mockRejectedValue(NO_ENCONTRADO);

    await expect(iniciar()).resolves.toEqual({ tipo: 'falta-politica' });

    expect(mockCrearPerfil).not.toHaveBeenCalled();
    expect(auth.signOut).not.toHaveBeenCalled();
    expect(consultas.getQueryData(CLAVE_CUENTA)).toBeUndefined();
  });

  test('un error de la API distinto de 404 cierra la sesión y se propaga', async () => {
    auth.signInWithPassword.mockResolvedValue({ data: { user: USUARIO_CON_POLITICA }, error: null });
    mockObtenerCuenta.mockRejectedValue(new ErrorApi(500, { title: 'Falla' }));

    await expect(iniciar()).rejects.toThrow('Falla');

    expect(auth.signOut).toHaveBeenCalledWith({ scope: 'local' });
  });

  test('credenciales inválidas dan un mensaje que no revela qué falló', async () => {
    auth.signInWithPassword.mockResolvedValue({ data: { user: null }, error: { code: 'invalid_credentials', message: 'x' } });

    await expect(iniciar()).rejects.toThrow('Correo o contraseña incorrectos');

    expect(auth.signOut).not.toHaveBeenCalled();
  });
});

describe('useCerrarSesion', () => {
  test('cierra la sesión local y limpia la caché', async () => {
    consultas.setQueryData(CLAVE_CUENTA, CUENTA);
    const { result } = await renderHook(() => useCerrarSesion(), { wrapper: envoltorio });

    await act(async () => {
      await result.current.mutateAsync();
    });

    expect(auth.signOut).toHaveBeenCalledWith({ scope: 'local' });
    expect(consultas.getQueryData(CLAVE_CUENTA)).toBeUndefined();
  });
});

describe('useEntrarConGoogle (celular)', () => {
  async function entrar() {
    const { result } = await renderHook(() => useEntrarConGoogle(), { wrapper: envoltorio });
    let promesa!: Promise<unknown>;
    await act(async () => {
      promesa = result.current.mutateAsync();
      await promesa.catch(() => undefined);
    });
    return promesa;
  }

  beforeEach(() => {
    auth.signInWithOAuth.mockResolvedValue({ data: { url: 'https://supabase/authorize' }, error: null });
  });

  test('abre Google y vuelve a la app con PKCE; sin perfil ni política pide aceptarla', async () => {
    mockAbrirVentana.mockResolvedValue({ type: 'success', url: 'weveh://auth/callback?code=abc' });
    auth.exchangeCodeForSession.mockResolvedValue({ error: null });
    conSesionDe(USUARIO_GOOGLE);
    mockObtenerCuenta.mockRejectedValue(NO_ENCONTRADO);

    await expect(entrar()).resolves.toEqual({ tipo: 'falta-politica' });

    expect(auth.signInWithOAuth).toHaveBeenCalledWith({
      provider: 'google',
      options: { redirectTo: 'weveh://auth/callback', skipBrowserRedirect: true },
    });
    expect(mockAbrirVentana).toHaveBeenCalledWith('https://supabase/authorize', 'weveh://auth/callback');
    expect(auth.exchangeCodeForSession).toHaveBeenCalledWith('abc');
    expect(mockCrearPerfil).not.toHaveBeenCalled();
  });

  test('con perfil existente entra directo', async () => {
    mockAbrirVentana.mockResolvedValue({ type: 'success', url: 'weveh://auth/callback?code=abc' });
    auth.exchangeCodeForSession.mockResolvedValue({ error: null });
    conSesionDe(USUARIO_GOOGLE);
    mockObtenerCuenta.mockResolvedValue(CUENTA);

    await expect(entrar()).resolves.toEqual({ tipo: 'lista', cuenta: CUENTA });
    expect(consultas.getQueryData(CLAVE_CUENTA)).toEqual(CUENTA);
  });

  test('si la persona cierra la ventana no pasa nada', async () => {
    mockAbrirVentana.mockResolvedValue({ type: 'cancel' });

    await expect(entrar()).resolves.toEqual({ tipo: 'cancelada' });
    expect(auth.exchangeCodeForSession).not.toHaveBeenCalled();
  });
});

describe('useEntradaDesdeEnlace (/auth/callback)', () => {
  test('un error en la URL no intenta canjear nada', async () => {
    const { result } = await renderHook(() => useEntradaDesdeEnlace({ error_code: 'otp_expired' }), {
      wrapper: envoltorio,
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error?.message).toBe('Este enlace venció o ya se usó. Pide otro.');
    expect(auth.exchangeCodeForSession).not.toHaveBeenCalled();
  });

  test('si el código ya se canjeó pero hay sesión, sigue (Android entrega el enlace dos veces)', async () => {
    auth.exchangeCodeForSession.mockResolvedValue({ error: { code: 'flow_state_not_found', status: 404, message: '' } });
    conSesionDe(USUARIO_GOOGLE);
    mockObtenerCuenta.mockResolvedValue(CUENTA);

    const { result } = await renderHook(() => useEntradaDesdeEnlace({ code: 'abc' }), { wrapper: envoltorio });

    await waitFor(() => expect(result.current.data).toEqual({ tipo: 'lista', cuenta: CUENTA }));
  });

  test('sin sesión después de canjear muestra el error', async () => {
    auth.exchangeCodeForSession.mockResolvedValue({ error: { code: 'flow_state_expired', status: 400, message: '' } });
    auth.getSession.mockResolvedValue({ data: { session: null } });

    const { result } = await renderHook(() => useEntradaDesdeEnlace({ code: 'viejo' }), { wrapper: envoltorio });

    await waitFor(() => expect(result.current.isError).toBe(true));
  });
});

describe('useAceptarPolitica', () => {
  test('con Google crea el perfil con el nombre de Google y medio APP_GOOGLE (RF-DAT-02)', async () => {
    conSesionDe(USUARIO_GOOGLE);
    mockCrearPerfil.mockResolvedValue(CUENTA);
    const { result } = await renderHook(() => useAceptarPolitica(), { wrapper: envoltorio });

    await act(async () => {
      await result.current.mutateAsync();
    });

    expect(mockCrearPerfil).toHaveBeenCalledWith(
      expect.objectContaining({ nombre: 'Laura Gómez', versionPolitica: '0.1-borrador', medio: 'APP_GOOGLE' }),
    );
    expect(consultas.getQueryData(CLAVE_CUENTA)).toEqual(CUENTA);
  });

  test('sin sesión no crea nada', async () => {
    auth.getSession.mockResolvedValue({ data: { session: null } });
    const { result } = await renderHook(() => useAceptarPolitica(), { wrapper: envoltorio });

    await act(async () => {
      await expect(result.current.mutateAsync()).rejects.toThrow('Tu sesión terminó');
    });
    expect(mockCrearPerfil).not.toHaveBeenCalled();
  });
});

describe('useFaltaPerfil', () => {
  test('con sesión y sin perfil en WEVEH es verdadero', async () => {
    conSesionDe(USUARIO_GOOGLE);
    mockObtenerCuenta.mockRejectedValue(NO_ENCONTRADO);
    await renderHook(() => usePrepararSesion(), { wrapper: envoltorio });

    const { result } = await renderHook(() => useFaltaPerfil(), { wrapper: envoltorio });

    await waitFor(() => expect(result.current).toBe(true));
  });
});
