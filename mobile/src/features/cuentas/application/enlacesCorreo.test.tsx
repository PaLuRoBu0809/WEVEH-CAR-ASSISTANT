import { notifyManager, QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react-native';
import type { ReactNode } from 'react';

import { supabase } from '../infrastructure/supabase';
import {
  useGuardarNuevaContrasena,
  usePedirRecuperacion,
  useReenviarVerificacion,
  useVerificarEnlace,
} from './enlacesCorreo';

jest.mock('../infrastructure/supabase', () => ({
  supabase: {
    auth: {
      verifyOtp: jest.fn(),
      resetPasswordForEmail: jest.fn(),
      resend: jest.fn(),
      updateUser: jest.fn(),
      signOut: jest.fn(),
    },
  },
}));

const auth = supabase.auth as unknown as Record<string, jest.Mock>;
const LIMITE = { code: 'over_email_send_rate_limit', status: 429, message: '' };

let consultas: QueryClient;

function envoltorio({ children }: { children: ReactNode }) {
  return <QueryClientProvider client={consultas}>{children}</QueryClientProvider>;
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

describe('useVerificarEnlace (RF-CTA-03, RF-CTA-04)', () => {
  test('verifica el enlace de recuperación una sola vez y deja la sesión para cambiar la contraseña', async () => {
    auth.verifyOtp.mockResolvedValue({ data: {}, error: null });

    const { result, rerender } = await renderHook(() => useVerificarEnlace('recovery', 'hash-1'), { wrapper: envoltorio });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    await rerender({});

    expect(auth.verifyOtp).toHaveBeenCalledTimes(1);
    expect(auth.verifyOtp).toHaveBeenCalledWith({ token_hash: 'hash-1', type: 'recovery' });
    expect(auth.signOut).not.toHaveBeenCalled();
  });

  test('al confirmar el correo cierra la sesión del enlace: el perfil se crea al iniciar sesión', async () => {
    auth.verifyOtp.mockResolvedValue({ data: {}, error: null });

    const { result } = await renderHook(() => useVerificarEnlace('email', 'hash-2'), { wrapper: envoltorio });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(auth.signOut).toHaveBeenCalledWith({ scope: 'local' });
  });

  test('un enlace vencido o ya usado termina en "Este enlace venció"', async () => {
    auth.verifyOtp.mockResolvedValue({ data: {}, error: { code: 'otp_expired', status: 403, message: '' } });

    const { result } = await renderHook(() => useVerificarEnlace('recovery', 'usado'), { wrapper: envoltorio });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error?.message).toContain('venció');
  });

  test('sin token en la URL ni siquiera llama a Supabase', async () => {
    const { result } = await renderHook(() => useVerificarEnlace('email', undefined), { wrapper: envoltorio });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(auth.verifyOtp).not.toHaveBeenCalled();
  });
});

describe('usePedirRecuperacion (RF-CTA-03)', () => {
  test('envía el correo limpio', async () => {
    auth.resetPasswordForEmail.mockResolvedValue({ error: null });

    await expect(ejecutar(() => usePedirRecuperacion(), ' ana@correo.co ')).resolves.toBe('ana@correo.co');
    expect(auth.resetPasswordForEmail).toHaveBeenCalledWith('ana@correo.co');
  });

  test('si Supabase falla dice lo mismo: no revela si la cuenta existe', async () => {
    auth.resetPasswordForEmail.mockResolvedValue({ error: { code: 'user_not_found', status: 400, message: '' } });

    await expect(ejecutar(() => usePedirRecuperacion(), 'nadie@correo.co')).resolves.toBe('nadie@correo.co');
  });

  test('el límite de envíos sí se muestra', async () => {
    auth.resetPasswordForEmail.mockResolvedValue({ error: LIMITE });

    await expect(ejecutar(() => usePedirRecuperacion(), 'ana@correo.co')).rejects.toThrow('muchos intentos');
  });
});

describe('useReenviarVerificacion (RF-CTA-04)', () => {
  test('reenvía el correo de confirmación del registro', async () => {
    auth.resend.mockResolvedValue({ error: null });

    await ejecutar(() => useReenviarVerificacion(), ' ana@correo.co ');

    expect(auth.resend).toHaveBeenCalledWith({ type: 'signup', email: 'ana@correo.co' });
  });

  test('solo el límite de envíos se muestra', async () => {
    auth.resend.mockResolvedValue({ error: LIMITE });

    await expect(ejecutar(() => useReenviarVerificacion(), 'ana@correo.co')).rejects.toThrow('muchos intentos');
  });
});

describe('useGuardarNuevaContrasena (RF-CTA-03)', () => {
  test('guarda la contraseña y cierra las demás sesiones', async () => {
    auth.updateUser.mockResolvedValue({ data: {}, error: null });

    await ejecutar(() => useGuardarNuevaContrasena(), 'nueva-segura');

    expect(auth.updateUser).toHaveBeenCalledWith({ password: 'nueva-segura' });
    expect(auth.signOut).toHaveBeenCalledWith({ scope: 'others' });
  });

  test('la misma contraseña de antes no se guarda y no cierra nada', async () => {
    auth.updateUser.mockResolvedValue({ data: {}, error: { code: 'same_password', status: 422, message: '' } });

    await expect(ejecutar(() => useGuardarNuevaContrasena(), 'la-de-antes')).rejects.toThrow('ya tenías');
    expect(auth.signOut).not.toHaveBeenCalled();
  });
});

describe('useVerificarEnlace con cambio de correo (RF-CTA-07)', () => {
  test('el primer enlace deja el cambio a medias y no cierra nada', async () => {
    auth.verifyOtp.mockResolvedValue({ data: { session: null }, error: null });

    const { result } = await renderHook(() => useVerificarEnlace('email_change', 'h1'), { wrapper: envoltorio });

    await waitFor(() => expect(result.current.data).toBe('falta-otro-enlace'));
    expect(auth.signOut).not.toHaveBeenCalled();
  });

  test('el segundo termina el cambio y cierra la sesión del enlace', async () => {
    auth.verifyOtp.mockResolvedValue({ data: { session: { access_token: 't' } }, error: null });

    const { result } = await renderHook(() => useVerificarEnlace('email_change', 'h2'), { wrapper: envoltorio });

    await waitFor(() => expect(result.current.data).toBe('listo'));
    expect(auth.verifyOtp).toHaveBeenCalledWith({ token_hash: 'h2', type: 'email_change' });
    expect(auth.signOut).toHaveBeenCalledWith({ scope: 'local' });
  });
});
