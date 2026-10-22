import { notifyManager, QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react-native';
import type { ReactNode } from 'react';

import { ErrorApi } from '@/shared/http';

import { editarNombre, eliminarCuenta } from '../infrastructure/apiCuenta';
import { supabase } from '../infrastructure/supabase';
import {
  useCambiarContrasena,
  useCambiarCorreo,
  useConfirmarIdentidad,
  useEditarNombre,
  useEliminarCuenta,
  useSesionReciente,
} from './gestionCuenta';
import { CLAVE_CUENTA } from './sesion';

jest.mock('@/shared/http', () => {
  const real = jest.requireActual('@/shared/http/errores');
  return { ErrorApi: real.ErrorApi, configurarSesion: jest.fn(), pedir: jest.fn() };
});
jest.mock('../infrastructure/apiCuenta', () => ({ editarNombre: jest.fn(), eliminarCuenta: jest.fn() }));
jest.mock('../infrastructure/urlDeRetorno', () => ({ urlDeRetorno: (ruta: string) => `weveh://${ruta}` }));
jest.mock('expo-web-browser', () => ({ openAuthSessionAsync: jest.fn() }));
jest.mock('../infrastructure/supabase', () => ({
  supabase: {
    auth: {
      getSession: jest.fn(),
      signInWithPassword: jest.fn(),
      updateUser: jest.fn(),
      signOut: jest.fn(),
    },
  },
}));

const auth = supabase.auth as unknown as Record<string, jest.Mock>;
const CUENTA = { nombre: 'Laura Gómez', correo: 'ana@correo.co', consentimientos: [] };

let consultas: QueryClient;

function envoltorio({ children }: { children: ReactNode }) {
  return <QueryClientProvider client={consultas}>{children}</QueryClientProvider>;
}

/** Un token de Supabase falso con el "iat" dado (la app no valida la firma, solo lee la fecha). */
function tokenEmitidoHace(segundos: number): string {
  const carga = btoa(JSON.stringify({ iat: Math.floor(Date.now() / 1000) - segundos }))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
  return `cabecera.${carga}.firma`;
}

function conSesion(token = tokenEmitidoHace(10)) {
  auth.getSession.mockResolvedValue({ data: { session: { access_token: token, user: { email: 'ana@correo.co' } } } });
}

beforeAll(() => {
  notifyManager.setScheduler((callback) => callback());
});

beforeEach(() => {
  jest.clearAllMocks();
  consultas = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: Infinity }, mutations: { retry: false, gcTime: Infinity } },
  });
  auth.signOut.mockResolvedValue({ error: null });
  conSesion();
});

afterEach(() => consultas.clear());

async function ejecutar<T>(hook: () => { mutateAsync: (dato: T) => Promise<unknown> }, dato: T) {
  const { result } = await renderHook(hook, { wrapper: envoltorio });
  let promesa!: Promise<unknown>;
  await act(async () => {
    promesa = result.current.mutateAsync(dato);
    await promesa.catch(() => undefined);
  });
  return promesa;
}

describe('useSesionReciente (RF-CTA-05)', () => {
  test('una sesión de hace segundos confirma la identidad', async () => {
    const { result } = await renderHook(() => useSesionReciente(), { wrapper: envoltorio });

    await waitFor(() => expect(result.current).toBe(true));
  });

  test('una sesión de hace 10 minutos no', async () => {
    conSesion(tokenEmitidoHace(600));
    const { result } = await renderHook(() => useSesionReciente(), { wrapper: envoltorio });

    await waitFor(() => expect(consultas.getQueryState(['sesion-reciente'])?.status).toBe('success'));
    expect(result.current).toBe(false);
  });

  test('un token ilegible o sin sesión no confirma nada', async () => {
    conSesion('sin-puntos');
    const { result } = await renderHook(() => useSesionReciente(), { wrapper: envoltorio });
    await waitFor(() => expect(consultas.getQueryState(['sesion-reciente'])?.status).toBe('success'));
    expect(result.current).toBe(false);

    conSesion('a.%%%.b');
    await act(async () => {
      await consultas.invalidateQueries({ queryKey: ['sesion-reciente'] });
    });
    expect(result.current).toBe(false);
  });
});

describe('useConfirmarIdentidad (RF-CTA-05)', () => {
  test('con la contraseña correcta vuelve a entrar con el correo actual', async () => {
    auth.signInWithPassword.mockResolvedValue({ data: {}, error: null });

    await ejecutar(() => useConfirmarIdentidad(), 'secreta123');

    expect(auth.signInWithPassword).toHaveBeenCalledWith({ email: 'ana@correo.co', password: 'secreta123' });
  });

  test('con la contraseña mala lo dice sin jerga', async () => {
    auth.signInWithPassword.mockResolvedValue({ data: {}, error: { code: 'invalid_credentials', status: 400, message: '' } });

    await expect(ejecutar(() => useConfirmarIdentidad(), 'otra')).rejects.toThrow('Esa no es tu contraseña actual');
  });

  test('sin sesión no intenta nada', async () => {
    auth.getSession.mockResolvedValue({ data: { session: null } });

    await expect(ejecutar(() => useConfirmarIdentidad(), 'secreta123')).rejects.toThrow('Tu sesión terminó');
    expect(auth.signInWithPassword).not.toHaveBeenCalled();
  });

  test('otros errores de Supabase pasan por el texto común', async () => {
    auth.signInWithPassword.mockResolvedValue({ data: {}, error: { code: 'over_request_rate_limit', status: 429, message: '' } });

    await expect(ejecutar(() => useConfirmarIdentidad(), 'x')).rejects.toThrow('muchos intentos');
  });
});

describe('useEditarNombre (RF-CTA-07)', () => {
  test('guarda el nombre limpio y actualiza la cuenta', async () => {
    (editarNombre as jest.Mock).mockResolvedValue(CUENTA);

    await ejecutar(() => useEditarNombre(), '  Laura Gómez ');

    expect(editarNombre).toHaveBeenCalledWith('Laura Gómez');
    expect(consultas.getQueryData(CLAVE_CUENTA)).toEqual(CUENTA);
  });
});

describe('useCambiarCorreo (RF-CTA-07)', () => {
  test('pide el cambio a Supabase con el correo limpio', async () => {
    auth.updateUser.mockResolvedValue({ data: {}, error: null });

    await expect(ejecutar(() => useCambiarCorreo(), ' nueva@correo.co ')).resolves.toBe('nueva@correo.co');
    expect(auth.updateUser).toHaveBeenCalledWith({ email: 'nueva@correo.co' });
  });

  test('un correo de otra cuenta lo dice claro', async () => {
    auth.updateUser.mockResolvedValue({ data: {}, error: { code: 'email_exists', status: 422, message: '' } });

    await expect(ejecutar(() => useCambiarCorreo(), 'otra@correo.co')).rejects.toThrow('ya lo usa otra cuenta');
  });

  test('otros errores pasan por el texto común', async () => {
    auth.updateUser.mockResolvedValue({ data: {}, error: { code: 'over_email_send_rate_limit', status: 429, message: '' } });

    await expect(ejecutar(() => useCambiarCorreo(), 'otra@correo.co')).rejects.toThrow('muchos intentos');
  });
});

describe('useCambiarContrasena', () => {
  test('comprueba la actual, guarda la nueva y cierra las demás sesiones', async () => {
    auth.signInWithPassword.mockResolvedValue({ data: {}, error: null });
    auth.updateUser.mockResolvedValue({ data: {}, error: null });

    await ejecutar(() => useCambiarContrasena(), { actual: 'vieja123', nueva: 'nueva1234' });

    expect(auth.signInWithPassword).toHaveBeenCalledWith({ email: 'ana@correo.co', password: 'vieja123' });
    expect(auth.updateUser).toHaveBeenCalledWith({ password: 'nueva1234' });
    expect(auth.signOut).toHaveBeenCalledWith({ scope: 'others' });
  });

  test('con la actual mala no cambia nada', async () => {
    auth.signInWithPassword.mockResolvedValue({ data: {}, error: { code: 'invalid_credentials', status: 400, message: '' } });

    await expect(ejecutar(() => useCambiarContrasena(), { actual: 'mala', nueva: 'nueva1234' })).rejects.toThrow(
      'Esa no es tu contraseña actual',
    );
    expect(auth.updateUser).not.toHaveBeenCalled();
  });
});

describe('useEliminarCuenta (RF-DAT-06)', () => {
  test('borra la cuenta, cierra la sesión y limpia lo guardado', async () => {
    (eliminarCuenta as jest.Mock).mockResolvedValue(undefined);
    consultas.setQueryData(CLAVE_CUENTA, CUENTA);

    await ejecutar(() => useEliminarCuenta(), undefined);

    expect(auth.signOut).toHaveBeenCalledWith({ scope: 'local' });
    expect(consultas.getQueryData(CLAVE_CUENTA)).toBeUndefined();
  });

  test('con una sesión vieja vuelve a pedir la identidad y no cierra la sesión', async () => {
    const vieja = new ErrorApi(401, { type: 'https://weveh.co/errores/identidad-no-confirmada', detail: 'Confirma que eres tú' });
    (eliminarCuenta as jest.Mock).mockRejectedValue(vieja);
    consultas.setQueryData(['sesion-reciente'], true);

    await expect(ejecutar(() => useEliminarCuenta(), undefined)).rejects.toBe(vieja);

    expect(auth.signOut).not.toHaveBeenCalled();
    // La pantalla deja de dar por confirmada la identidad y vuelve a preguntar
    expect(consultas.getQueryState(['sesion-reciente'])?.isInvalidated).toBe(true);
  });

  test('sin red no borra nada en el celular', async () => {
    (eliminarCuenta as jest.Mock).mockRejectedValue(new Error('Sin red'));

    await expect(ejecutar(() => useEliminarCuenta(), undefined)).rejects.toThrow('Sin red');
    expect(auth.signOut).not.toHaveBeenCalled();
  });
});
