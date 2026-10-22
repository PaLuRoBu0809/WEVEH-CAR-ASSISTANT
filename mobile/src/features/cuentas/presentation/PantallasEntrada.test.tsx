import { fireEvent, render, screen } from '@testing-library/react-native';

import { useEstadoTema } from '@/shared/design-system';

import {
  useAceptarPolitica,
  useCerrarSesion,
  useCrearCuenta,
  useEntradaDesdeEnlace,
  useEntrarConGoogle,
  useIniciarSesion,
  useUsuarioDeSesion,
} from '../application/sesion';
import { POLITICA, RESUMEN_POLITICA } from '../domain/politica';
import { PantallaAceptarPolitica } from './PantallaAceptarPolitica';
import { PantallaCrearCuenta } from './PantallaCrearCuenta';
import { PantallaIniciarSesion } from './PantallaIniciarSesion';
import { PantallaPolitica } from './PantallaPolitica';
import { PantallaRegresoGoogle } from './PantallaRegresoGoogle';

jest.mock('react-native-safe-area-context', () => jest.requireActual('react-native-safe-area-context/jest/mock').default);
jest.mock('../application/sesion', () => ({
  useIniciarSesion: jest.fn(),
  useEntrarConGoogle: jest.fn(),
  useCrearCuenta: jest.fn(),
  useAceptarPolitica: jest.fn(),
  useCerrarSesion: jest.fn(),
  useUsuarioDeSesion: jest.fn(),
  useEntradaDesdeEnlace: jest.fn(),
}));

type Opciones = { onSuccess?: (dato: unknown) => void; onSettled?: () => void };

function mutacion(estado: Record<string, unknown> = {}, dato?: unknown) {
  return {
    isPending: false,
    isError: false,
    error: null,
    mutate: jest.fn((_entrada: unknown, opciones?: Opciones) => {
      opciones?.onSuccess?.(dato);
      opciones?.onSettled?.();
    }),
    ...estado,
  };
}

const CUENTA = { nombre: 'Ana', correo: 'ana@correo.co', consentimientos: [] };
const LISTA = { tipo: 'lista', cuenta: CUENTA };
const FALTA_POLITICA = { tipo: 'falta-politica' };

const destinos = () => ({ onSesionIniciada: jest.fn(), onFaltaPolitica: jest.fn() });

beforeEach(() => {
  jest.clearAllMocks();
  useEstadoTema.setState({ modo: 'claro' });
  (useEntrarConGoogle as jest.Mock).mockReturnValue(mutacion({}, { tipo: 'cancelada' }));
  (useCerrarSesion as jest.Mock).mockReturnValue(mutacion());
});

describe('PantallaIniciarSesion (RF-CTA-02)', () => {
  const props = () => ({ ...destinos(), onVolver: jest.fn(), onCrearCuenta: jest.fn(), onOlvideContrasena: jest.fn() });

  test('con correo y contraseña entra y sigue al garaje', async () => {
    const entrar = mutacion({}, LISTA);
    (useIniciarSesion as jest.Mock).mockReturnValue(entrar);
    const p = props();
    await render(<PantallaIniciarSesion {...p} />);

    expect(screen.getByRole('button', { name: 'Entrar' })).toBeDisabled();
    await fireEvent.changeText(screen.getByLabelText('Correo'), 'ana@correo.co');
    await fireEvent.changeText(screen.getByLabelText('Contraseña'), 'secreta123');
    await fireEvent.press(screen.getByRole('button', { name: 'Entrar' }));

    expect(entrar.mutate).toHaveBeenCalledWith({ correo: 'ana@correo.co', contrasena: 'secreta123' }, expect.anything());
    expect(p.onSesionIniciada).toHaveBeenCalled();
  });

  test('con Google sin política aceptada lleva a "Antes de entrar"', async () => {
    (useIniciarSesion as jest.Mock).mockReturnValue(mutacion());
    (useEntrarConGoogle as jest.Mock).mockReturnValue(mutacion({}, FALTA_POLITICA));
    const p = props();
    await render(<PantallaIniciarSesion {...p} />);

    await fireEvent.press(screen.getByRole('button', { name: 'Continuar con Google' }));

    expect(p.onFaltaPolitica).toHaveBeenCalled();
    expect(p.onSesionIniciada).not.toHaveBeenCalled();
  });

  test('si cierra la ventana de Google se queda en la pantalla', async () => {
    (useIniciarSesion as jest.Mock).mockReturnValue(mutacion());
    const p = props();
    await render(<PantallaIniciarSesion {...p} />);

    await fireEvent.press(screen.getByRole('button', { name: 'Continuar con Google' }));

    expect(p.onFaltaPolitica).not.toHaveBeenCalled();
    expect(p.onSesionIniciada).not.toHaveBeenCalled();
  });

  test('muestra el error y lleva a recuperar la contraseña', async () => {
    (useIniciarSesion as jest.Mock).mockReturnValue(mutacion({ isError: true, error: new Error('Correo o contraseña incorrectos.') }));
    const p = props();
    await render(<PantallaIniciarSesion {...p} />);

    await fireEvent.press(screen.getByRole('link', { name: '¿Olvidaste tu contraseña?' }));

    expect(screen.getByText('Correo o contraseña incorrectos.')).toBeTruthy();
    expect(p.onOlvideContrasena).toHaveBeenCalled();
  });

  test('mientras abre Google el botón queda ocupado; en modo oscuro también se ve', async () => {
    useEstadoTema.setState({ modo: 'oscuro' });
    (useIniciarSesion as jest.Mock).mockReturnValue(mutacion());
    (useEntrarConGoogle as jest.Mock).mockReturnValue(mutacion({ isPending: true }));
    await render(<PantallaIniciarSesion {...props()} />);

    expect(screen.getByRole('button', { name: 'Abriendo Google…' })).toBeDisabled();
  });
});

describe('PantallaCrearCuenta (RF-CTA-01, RF-DAT-01)', () => {
  const props = () => ({
    ...destinos(),
    onVolver: jest.fn(),
    onIniciarSesion: jest.fn(),
    onRevisarCorreo: jest.fn(),
    onLeerPolitica: jest.fn(),
  });

  async function llenar() {
    await fireEvent.changeText(screen.getByLabelText('Nombre'), 'Ana');
    await fireEvent.changeText(screen.getByLabelText('Correo'), 'ana@correo.co');
    await fireEvent.changeText(screen.getByLabelText('Contraseña'), 'secreta123');
    await fireEvent.press(screen.getByRole('checkbox'));
  }

  test('con verificación de correo pasa a "Revisa tu correo"', async () => {
    (useCrearCuenta as jest.Mock).mockReturnValue(mutacion({}, { requiereVerificarCorreo: true, correo: 'ana@correo.co' }));
    const p = props();
    await render(<PantallaCrearCuenta {...p} />);

    await llenar();
    await fireEvent.press(screen.getByRole('button', { name: 'Crear cuenta' }));

    expect(p.onRevisarCorreo).toHaveBeenCalledWith('ana@correo.co');
  });

  test('sin verificación de correo entra directo', async () => {
    (useCrearCuenta as jest.Mock).mockReturnValue(mutacion({}, { requiereVerificarCorreo: false, correo: 'ana@correo.co' }));
    const p = props();
    await render(<PantallaCrearCuenta {...p} />);

    await llenar();
    await fireEvent.press(screen.getByRole('button', { name: 'Crear cuenta' }));

    expect(p.onSesionIniciada).toHaveBeenCalled();
  });

  test('deja leer la política, entrar con Google y muestra el error', async () => {
    (useCrearCuenta as jest.Mock).mockReturnValue(mutacion({ isError: true, error: new Error('Ya existe una cuenta') }));
    (useEntrarConGoogle as jest.Mock).mockReturnValue(mutacion({}, LISTA));
    const p = props();
    await render(<PantallaCrearCuenta {...p} />);

    await fireEvent.press(screen.getByRole('link', { name: 'Leer la política' }));
    await fireEvent.press(screen.getByRole('button', { name: 'Continuar con Google' }));

    expect(screen.getByText('Ya existe una cuenta')).toBeTruthy();
    expect(p.onLeerPolitica).toHaveBeenCalled();
    expect(p.onSesionIniciada).toHaveBeenCalled();
  });
});

describe('PantallaAceptarPolitica (RF-DAT-01)', () => {
  const props = () => ({ onLeerPolitica: jest.fn(), onAceptada: jest.fn(), onSalir: jest.fn() });

  test('con Google: muestra el correo y el resumen, y solo continúa con la casilla marcada', async () => {
    (useUsuarioDeSesion as jest.Mock).mockReturnValue({ correo: 'laura@gmail.com', conGoogle: true });
    const aceptar = mutacion();
    (useAceptarPolitica as jest.Mock).mockReturnValue(aceptar);
    const p = props();
    await render(<PantallaAceptarPolitica {...p} />);

    expect(screen.getByText(/Entraste con Google como/)).toBeTruthy();
    RESUMEN_POLITICA.forEach((punto) => expect(screen.getByText(punto)).toBeTruthy());
    expect(screen.getByRole('button', { name: 'Continuar' })).toBeDisabled();

    await fireEvent.press(screen.getByRole('checkbox'));
    await fireEvent.press(screen.getByRole('button', { name: 'Continuar' }));

    expect(aceptar.mutate).toHaveBeenCalled();
    expect(p.onAceptada).toHaveBeenCalled();
  });

  test('sin Google dice "Entraste como", muestra el error y deja leer la política', async () => {
    (useUsuarioDeSesion as jest.Mock).mockReturnValue({ correo: 'ana@correo.co', conGoogle: false });
    (useAceptarPolitica as jest.Mock).mockReturnValue(mutacion({ isError: true, error: new Error('Tu sesión terminó.') }));
    const p = props();
    await render(<PantallaAceptarPolitica {...p} />);

    await fireEvent.press(screen.getByRole('link', { name: 'Leer la política completa' }));

    expect(screen.getByText(/^Entraste como/)).toBeTruthy();
    expect(screen.getByText('Tu sesión terminó.')).toBeTruthy();
    expect(p.onLeerPolitica).toHaveBeenCalled();
  });

  test('salir cierra la sesión sin crear la cuenta', async () => {
    (useUsuarioDeSesion as jest.Mock).mockReturnValue(undefined);
    const aceptar = mutacion();
    (useAceptarPolitica as jest.Mock).mockReturnValue(aceptar);
    const cerrar = mutacion();
    (useCerrarSesion as jest.Mock).mockReturnValue(cerrar);
    const p = props();
    await render(<PantallaAceptarPolitica {...p} />);

    await fireEvent.press(screen.getByRole('link', { name: 'Salir' }));

    expect(cerrar.mutate).toHaveBeenCalled();
    expect(p.onSalir).toHaveBeenCalled();
    expect(aceptar.mutate).not.toHaveBeenCalled();
  });
});

describe('PantallaPolitica (RF-DAT-01)', () => {
  test('muestra la etiqueta Borrador y todas las secciones', async () => {
    await render(<PantallaPolitica />);

    expect(screen.getByText('Borrador')).toBeTruthy();
    POLITICA.secciones.forEach((seccion) => expect(screen.getByRole('header', { name: seccion.titulo })).toBeTruthy());
    expect(screen.queryByRole('button', { name: 'Volver' })).toBeNull();
  });

  test('desde la app tiene flecha para volver', async () => {
    const onVolver = jest.fn();
    await render(<PantallaPolitica onVolver={onVolver} />);

    await fireEvent.press(screen.getByRole('button', { name: 'Volver' }));

    expect(onVolver).toHaveBeenCalled();
  });
});

describe('PantallaRegresoGoogle (RF-CTA-02)', () => {
  const props = () => ({ ...destinos(), parametros: { code: 'abc' }, onVolverAIniciarSesion: jest.fn() });

  test('mientras canjea el código lo dice', async () => {
    (useEntradaDesdeEnlace as jest.Mock).mockReturnValue({ isError: false, data: undefined });
    await render(<PantallaRegresoGoogle {...props()} />);

    expect(screen.getByRole('header', { name: 'Entrando con Google…' })).toBeTruthy();
  });

  test('con el perfil listo sigue al garaje', async () => {
    (useEntradaDesdeEnlace as jest.Mock).mockReturnValue({ isError: false, data: LISTA });
    const p = props();
    await render(<PantallaRegresoGoogle {...p} />);

    expect(p.onSesionIniciada).toHaveBeenCalled();
  });

  test('sin política sigue a "Antes de entrar"', async () => {
    (useEntradaDesdeEnlace as jest.Mock).mockReturnValue({ isError: false, data: FALTA_POLITICA });
    const p = props();
    await render(<PantallaRegresoGoogle {...p} />);

    expect(p.onFaltaPolitica).toHaveBeenCalled();
  });

  test('si falla muestra el error y deja volver a iniciar sesión', async () => {
    (useEntradaDesdeEnlace as jest.Mock).mockReturnValue({ isError: true, error: new Error('Este enlace venció') });
    const p = props();
    await render(<PantallaRegresoGoogle {...p} />);

    await fireEvent.press(screen.getByRole('button', { name: 'Volver a iniciar sesión' }));

    expect(screen.getByText('Este enlace venció')).toBeTruthy();
    expect(p.onVolverAIniciarSesion).toHaveBeenCalled();
  });
});
