import { act, fireEvent, render, screen } from '@testing-library/react-native';

import {
  useGuardarNuevaContrasena,
  usePedirRecuperacion,
  useReenviarVerificacion,
  useVerificarEnlace,
} from '../application/enlacesCorreo';
import { useCerrarSesion } from '../application/sesion';
import { PantallaCuentaConfirmada } from './PantallaCuentaConfirmada';
import { PantallaNuevaContrasena } from './PantallaNuevaContrasena';
import { PantallaOlvideContrasena } from './PantallaOlvideContrasena';
import { PantallaRevisaCorreo } from './PantallaRevisaCorreo';

jest.mock('react-native-safe-area-context', () => jest.requireActual('react-native-safe-area-context/jest/mock').default);
jest.mock('../application/enlacesCorreo', () => ({
  useVerificarEnlace: jest.fn(),
  usePedirRecuperacion: jest.fn(),
  useReenviarVerificacion: jest.fn(),
  useGuardarNuevaContrasena: jest.fn(),
}));
jest.mock('../application/sesion', () => ({ useCerrarSesion: jest.fn() }));

type Opciones = { onSuccess?: (dato: unknown) => void; onSettled?: () => void };

/** Una mutación de React Query simulada: mutate llama a onSuccess y onSettled con el dato dado. */
function mutacion(estado: Record<string, unknown> = {}, dato?: unknown) {
  return {
    isPending: false,
    isError: false,
    isSuccess: false,
    error: null,
    mutate: jest.fn((_entrada: unknown, opciones?: Opciones) => {
      opciones?.onSuccess?.(dato);
      opciones?.onSettled?.();
    }),
    ...estado,
  };
}

/** La cuenta atrás de Reenviar programa un temporizador por segundo, después de cada render. */
async function esperarSegundos(segundos: number) {
  for (let segundo = 0; segundo < segundos; segundo++) {
    await act(async () => {
      jest.advanceTimersByTime(1000);
    });
  }
}

const verificacion = (estado: 'pendiente' | 'ok' | 'vencido') => ({
  isPending: estado === 'pendiente',
  isError: estado === 'vencido',
  isSuccess: estado === 'ok',
});

beforeEach(() => {
  jest.clearAllMocks();
  (useCerrarSesion as jest.Mock).mockReturnValue(mutacion());
  (useReenviarVerificacion as jest.Mock).mockReturnValue(mutacion());
  (useGuardarNuevaContrasena as jest.Mock).mockReturnValue(mutacion());
});

describe('PantallaOlvideContrasena (RF-CTA-03)', () => {
  test('sin un correo válido no se puede enviar', async () => {
    (usePedirRecuperacion as jest.Mock).mockReturnValue(mutacion());
    await render(<PantallaOlvideContrasena onVolverAIniciarSesion={jest.fn()} />);

    await fireEvent.changeText(screen.getByLabelText('Correo'), 'ana@');

    expect(screen.getByRole('button', { name: 'Enviar enlace' })).toBeDisabled();
  });

  test('al enviar muestra "Enlace enviado" sin decir si la cuenta existe y bloquea Reenviar 60 s', async () => {
    jest.useFakeTimers();
    const pedir = mutacion({}, 'ana@correo.co');
    (usePedirRecuperacion as jest.Mock).mockReturnValue(pedir);
    await render(<PantallaOlvideContrasena onVolverAIniciarSesion={jest.fn()} />);

    await fireEvent.changeText(screen.getByLabelText('Correo'), 'ana@correo.co');
    await fireEvent.press(screen.getByRole('button', { name: 'Enviar enlace' }));

    expect(screen.getByRole('header', { name: 'Enlace enviado' })).toBeTruthy();
    expect(screen.getByText(/Si hay una cuenta con/)).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Reenviar en 60 s' })).toBeDisabled();

    await esperarSegundos(60);
    await fireEvent.press(screen.getByRole('button', { name: 'Reenviar' }));

    expect(pedir.mutate).toHaveBeenCalledTimes(2);
    jest.useRealTimers();
  });

  test('muestra el límite de envíos y vuelve a iniciar sesión', async () => {
    (usePedirRecuperacion as jest.Mock).mockReturnValue(mutacion({ isError: true, error: new Error('Hiciste muchos intentos') }));
    const onVolver = jest.fn();
    await render(<PantallaOlvideContrasena onVolverAIniciarSesion={onVolver} />);

    expect(screen.getByText('Hiciste muchos intentos')).toBeTruthy();
    await fireEvent.press(screen.getByRole('link', { name: 'Volver a iniciar sesión' }));
    expect(onVolver).toHaveBeenCalled();
  });
});

describe('PantallaNuevaContrasena (RF-CTA-03)', () => {
  const props = () => ({ tokenHash: 'h', onPedirOtroEnlace: jest.fn(), onIniciarSesion: jest.fn() });

  test('mientras revisa el enlace lo dice', async () => {
    (useVerificarEnlace as jest.Mock).mockReturnValue(verificacion('pendiente'));
    (useGuardarNuevaContrasena as jest.Mock).mockReturnValue(mutacion());
    await render(<PantallaNuevaContrasena {...props()} />);

    expect(screen.getByRole('header', { name: 'Revisando el enlace…' })).toBeTruthy();
  });

  test('un enlace vencido permite pedir otro', async () => {
    (useVerificarEnlace as jest.Mock).mockReturnValue(verificacion('vencido'));
    (useGuardarNuevaContrasena as jest.Mock).mockReturnValue(mutacion());
    const p = props();
    await render(<PantallaNuevaContrasena {...p} />);

    await fireEvent.press(screen.getByRole('button', { name: 'Pedir otro enlace' }));

    expect(screen.getByRole('header', { name: 'Este enlace venció' })).toBeTruthy();
    expect(p.onPedirOtroEnlace).toHaveBeenCalled();
  });

  test('solo guarda cuando las dos contraseñas cumplen la regla y coinciden', async () => {
    (useVerificarEnlace as jest.Mock).mockReturnValue(verificacion('ok'));
    const guardar = mutacion();
    (useGuardarNuevaContrasena as jest.Mock).mockReturnValue(guardar);
    await render(<PantallaNuevaContrasena {...props()} />);

    await fireEvent.changeText(screen.getByLabelText('Nueva contraseña'), '12345678');
    await fireEvent.changeText(screen.getByLabelText('Confirma tu contraseña'), '1234567');
    expect(screen.getByRole('button', { name: 'Guardar' })).toBeDisabled();

    await fireEvent.changeText(screen.getByLabelText('Confirma tu contraseña'), '12345678');
    await fireEvent.press(screen.getByRole('button', { name: 'Guardar' }));

    expect(guardar.mutate).toHaveBeenCalledWith('12345678');
  });

  test('muestra el error al guardar', async () => {
    (useVerificarEnlace as jest.Mock).mockReturnValue(verificacion('ok'));
    (useGuardarNuevaContrasena as jest.Mock).mockReturnValue(mutacion({ isError: true, error: new Error('Esa es la contraseña que ya tenías') }));
    await render(<PantallaNuevaContrasena {...props()} />);

    expect(screen.getByText(/ya tenías/)).toBeTruthy();
  });

  test('después de guardar cierra esta sesión y lleva a iniciar sesión', async () => {
    (useVerificarEnlace as jest.Mock).mockReturnValue(verificacion('ok'));
    (useGuardarNuevaContrasena as jest.Mock).mockReturnValue(mutacion({ isSuccess: true }));
    const cerrar = mutacion();
    (useCerrarSesion as jest.Mock).mockReturnValue(cerrar);
    const p = props();
    await render(<PantallaNuevaContrasena {...p} />);

    await fireEvent.press(screen.getByRole('button', { name: 'Iniciar sesión' }));

    expect(screen.getByRole('header', { name: 'Listo, ya puedes entrar' })).toBeTruthy();
    expect(cerrar.mutate).toHaveBeenCalled();
    expect(p.onIniciarSesion).toHaveBeenCalled();
  });
});

describe('PantallaCuentaConfirmada (RF-CTA-04)', () => {
  const props = () => ({ tokenHash: 'h', onAbrirApp: jest.fn(), onIniciarSesion: jest.fn() });

  test('mientras confirma lo dice', async () => {
    (useVerificarEnlace as jest.Mock).mockReturnValue(verificacion('pendiente'));
    await render(<PantallaCuentaConfirmada {...props()} />);

    expect(screen.getByRole('header', { name: 'Confirmando tu correo…' })).toBeTruthy();
  });

  test('confirmada ofrece abrir la app o iniciar sesión', async () => {
    (useVerificarEnlace as jest.Mock).mockReturnValue(verificacion('ok'));
    const p = props();
    await render(<PantallaCuentaConfirmada {...p} />);

    await fireEvent.press(screen.getByRole('button', { name: 'Abrir WEVEH' }));
    await fireEvent.press(screen.getByRole('button', { name: 'Iniciar sesión' }));

    expect(p.onAbrirApp).toHaveBeenCalled();
    expect(p.onIniciarSesion).toHaveBeenCalled();
  });

  test('vencida pide el correo para reenviar y avisa que lo envió', async () => {
    (useVerificarEnlace as jest.Mock).mockReturnValue(verificacion('vencido'));
    const reenviar = mutacion();
    (useReenviarVerificacion as jest.Mock).mockReturnValue(reenviar);
    await render(<PantallaCuentaConfirmada {...props()} />);

    expect(screen.getByRole('button', { name: 'Reenviar verificación' })).toBeDisabled();
    await fireEvent.changeText(screen.getByLabelText('Correo'), 'ana@correo.co');
    await fireEvent.press(screen.getByRole('button', { name: 'Reenviar verificación' }));

    expect(reenviar.mutate).toHaveBeenCalledWith('ana@correo.co', expect.anything());
  });

  test('vencida muestra el resultado del reenvío', async () => {
    (useVerificarEnlace as jest.Mock).mockReturnValue(verificacion('vencido'));
    (useReenviarVerificacion as jest.Mock).mockReturnValue(mutacion({ isSuccess: true, isError: true, error: new Error('Límite') }));
    await render(<PantallaCuentaConfirmada {...props()} />);

    expect(screen.getByText(/te enviamos un nuevo correo/)).toBeTruthy();
    expect(screen.getByText('Límite')).toBeTruthy();
  });
});

describe('PantallaRevisaCorreo (RF-CTA-04)', () => {
  test('muestra a qué correo se envió y Reenviar empieza bloqueado', async () => {
    (useReenviarVerificacion as jest.Mock).mockReturnValue(mutacion({ isSuccess: true }));
    const onUsarOtro = jest.fn();
    await render(<PantallaRevisaCorreo correo="ana@correo.co" onUsarOtroCorreo={onUsarOtro} onIniciarSesion={jest.fn()} />);

    expect(screen.getByText('ana@correo.co')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Reenviar en 60 s' })).toBeDisabled();
    expect(screen.getByText('Te enviamos el correo otra vez.')).toBeTruthy();

    await fireEvent.press(screen.getByRole('link', { name: 'Usar otro correo' }));
    expect(onUsarOtro).toHaveBeenCalled();
  });

  test('pasado el tiempo deja reenviar', async () => {
    jest.useFakeTimers();
    const reenviar = mutacion({ isError: true, error: new Error('Hiciste muchos intentos') });
    (useReenviarVerificacion as jest.Mock).mockReturnValue(reenviar);
    await render(<PantallaRevisaCorreo correo="ana@correo.co" onUsarOtroCorreo={jest.fn()} onIniciarSesion={jest.fn()} />);

    await esperarSegundos(60);
    await fireEvent.press(screen.getByRole('button', { name: 'Reenviar' }));

    expect(reenviar.mutate).toHaveBeenCalledWith('ana@correo.co', expect.anything());
    expect(screen.getByText('Hiciste muchos intentos')).toBeTruthy();
    jest.useRealTimers();
  });
});
