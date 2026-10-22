import { fireEvent, render, screen } from '@testing-library/react-native';

import { useVerificarEnlace } from '../application/enlacesCorreo';
import {
  useCambiarContrasena,
  useCambiarCorreo,
  useConfirmarIdentidad,
  useEditarNombre,
  useEliminarCuenta,
  useSesionReciente,
} from '../application/gestionCuenta';
import { useCuenta, useEntrarConGoogle, useUsuarioDeSesion } from '../application/sesion';
import { PantallaCorreoCambiado } from './PantallaCorreoCambiado';
import { PantallaEliminarCuenta } from './PantallaEliminarCuenta';
import { PantallaMisDatos } from './PantallaMisDatos';
import { PantallaCambiarContrasena, PantallaCambiarCorreo, PantallaCambiarNombre } from './PantallasEditarCuenta';

jest.mock('react-native-safe-area-context', () => jest.requireActual('react-native-safe-area-context/jest/mock').default);
jest.mock('../application/enlacesCorreo', () => ({ useVerificarEnlace: jest.fn() }));
jest.mock('../application/gestionCuenta', () => ({
  useCambiarContrasena: jest.fn(),
  useCambiarCorreo: jest.fn(),
  useConfirmarIdentidad: jest.fn(),
  useEditarNombre: jest.fn(),
  useEliminarCuenta: jest.fn(),
  useSesionReciente: jest.fn(),
}));
jest.mock('../application/sesion', () => ({
  useCuenta: jest.fn(),
  useEntrarConGoogle: jest.fn(),
  useUsuarioDeSesion: jest.fn(),
}));

type Opciones = { onSuccess?: (dato: unknown) => void };

function mutacion(estado: Record<string, unknown> = {}, dato?: unknown) {
  return {
    isPending: false,
    isError: false,
    isSuccess: false,
    error: null,
    mutate: jest.fn((_entrada: unknown, opciones?: Opciones) => opciones?.onSuccess?.(dato)),
    ...estado,
  };
}

const CUENTA = {
  nombre: 'Laura',
  correo: 'laura@correo.co',
  consentimientos: [{ versionPolitica: '0.1-borrador', aceptadoEn: '2026-10-21T15:00:00Z', medio: 'APP_GOOGLE' }],
};

beforeEach(() => {
  jest.clearAllMocks();
  (useCuenta as jest.Mock).mockReturnValue({ data: CUENTA, isError: false });
  (useUsuarioDeSesion as jest.Mock).mockReturnValue({ correo: CUENTA.correo, conGoogle: false });
  (useSesionReciente as jest.Mock).mockReturnValue(true);
  (useConfirmarIdentidad as jest.Mock).mockReturnValue(mutacion());
  (useEntrarConGoogle as jest.Mock).mockReturnValue(mutacion());
});

describe('PantallaMisDatos (RF-DAT-04)', () => {
  const props = () => ({
    onVolver: jest.fn(),
    onCambiarNombre: jest.fn(),
    onCambiarCorreo: jest.fn(),
    onCambiarContrasena: jest.fn(),
    onEliminar: jest.fn(),
    onLeerPolitica: jest.fn(),
  });

  test('muestra los datos, para qué se usan y la autorización con su fecha y medio', async () => {
    await render(<PantallaMisDatos {...props()} />);

    expect(screen.getByText('Laura')).toBeTruthy();
    expect(screen.getByText('laura@correo.co')).toBeTruthy();
    expect(screen.getByText('Tu nombre y tu correo')).toBeTruthy();
    expect(screen.getByText(/No guardamos tu cédula/)).toBeTruthy();
    expect(screen.getByText('Aceptaste la política 0.1-borrador el 21 oct 2026, al entrar con Google.')).toBeTruthy();
  });

  test('cada acción lleva a su pantalla', async () => {
    const p = props();
    await render(<PantallaMisDatos {...p} />);

    await fireEvent.press(screen.getByRole('button', { name: 'Cambiar nombre' }));
    await fireEvent.press(screen.getByRole('button', { name: 'Cambiar correo' }));
    await fireEvent.press(screen.getByRole('button', { name: 'Cambiar contraseña' }));
    await fireEvent.press(screen.getByRole('button', { name: 'Eliminar mi cuenta' }));
    await fireEvent.press(screen.getByRole('link', { name: 'Leer la política completa' }));

    expect(p.onCambiarNombre).toHaveBeenCalled();
    expect(p.onCambiarCorreo).toHaveBeenCalled();
    expect(p.onCambiarContrasena).toHaveBeenCalled();
    expect(p.onEliminar).toHaveBeenCalled();
    expect(p.onLeerPolitica).toHaveBeenCalled();
  });

  test('con Google no ofrece cambiar correo ni contraseña', async () => {
    (useUsuarioDeSesion as jest.Mock).mockReturnValue({ correo: CUENTA.correo, conGoogle: true });
    await render(<PantallaMisDatos {...props()} />);

    expect(screen.getByText(/los administra Google/)).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Cambiar correo' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Cambiar contraseña' })).toBeNull();
  });

  test('si no carga la cuenta lo dice', async () => {
    (useCuenta as jest.Mock).mockReturnValue({ data: undefined, isError: true, error: new Error('Sin red') });
    (useUsuarioDeSesion as jest.Mock).mockReturnValue(undefined);
    await render(<PantallaMisDatos {...props()} />);

    expect(screen.getByText('Sin red')).toBeTruthy();
    expect(screen.getAllByText('Cargando…')).toHaveLength(2);
  });
});

describe('PantallaCambiarNombre (RF-CTA-07)', () => {
  test('parte del nombre actual y solo guarda uno válido', async () => {
    const editar = mutacion();
    (useEditarNombre as jest.Mock).mockReturnValue(editar);
    await render(<PantallaCambiarNombre onVolver={jest.fn()} />);

    expect(screen.getByLabelText('Nombre').props.value).toBe('Laura');
    expect(screen.getByRole('button', { name: 'Guardar' })).toBeDisabled();

    await fireEvent.changeText(screen.getByLabelText('Nombre'), '   ');
    expect(screen.getByText('Escribe tu nombre')).toBeTruthy();

    await fireEvent.changeText(screen.getByLabelText('Nombre'), 'Laura Gómez');
    await fireEvent.press(screen.getByRole('button', { name: 'Guardar' }));
    expect(editar.mutate).toHaveBeenCalledWith('Laura Gómez');
  });

  test('al guardar lo confirma y muestra el error si falla', async () => {
    (useEditarNombre as jest.Mock).mockReturnValue(mutacion({ isSuccess: true, data: { nombre: 'Laura Gómez' } }));
    const onVolver = jest.fn();
    const { rerender } = await render(<PantallaCambiarNombre onVolver={onVolver} />);

    expect(screen.getByText('Ahora te llamamos Laura Gómez.')).toBeTruthy();
    await fireEvent.press(screen.getByRole('button', { name: 'Volver a Mis datos' }));
    expect(onVolver).toHaveBeenCalled();

    (useEditarNombre as jest.Mock).mockReturnValue(mutacion({ isError: true, error: new Error('No se pudo') }));
    await rerender(<PantallaCambiarNombre onVolver={onVolver} />);
    expect(screen.getByText('No se pudo')).toBeTruthy();
  });
});

describe('PantallaCambiarCorreo (RF-CTA-07, RF-CTA-05)', () => {
  test('sin identidad confirmada pide la contraseña primero', async () => {
    (useSesionReciente as jest.Mock).mockReturnValue(false);
    const confirmar = mutacion();
    (useConfirmarIdentidad as jest.Mock).mockReturnValue(confirmar);
    (useCambiarCorreo as jest.Mock).mockReturnValue(mutacion());
    await render(<PantallaCambiarCorreo onVolver={jest.fn()} />);

    expect(screen.queryByLabelText('Correo nuevo')).toBeNull();
    expect(screen.getByRole('button', { name: 'Confirmar que soy yo' })).toBeDisabled();
    await fireEvent.changeText(screen.getByLabelText('Tu contraseña actual'), 'secreta123');
    await fireEvent.press(screen.getByRole('button', { name: 'Confirmar que soy yo' }));

    expect(confirmar.mutate).toHaveBeenCalledWith('secreta123');
  });

  test('con identidad confirmada pide un correo nuevo distinto del actual', async () => {
    const cambiar = mutacion();
    (useCambiarCorreo as jest.Mock).mockReturnValue(cambiar);
    await render(<PantallaCambiarCorreo onVolver={jest.fn()} />);

    await fireEvent.changeText(screen.getByLabelText('Correo nuevo'), 'laura@correo.co');
    expect(screen.getByText('Ese ya es tu correo')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Enviar enlaces' })).toBeDisabled();

    await fireEvent.changeText(screen.getByLabelText('Correo nuevo'), 'laura.gomez@correo.co');
    await fireEvent.press(screen.getByRole('button', { name: 'Enviar enlaces' }));
    expect(cambiar.mutate).toHaveBeenCalledWith('laura.gomez@correo.co');
  });

  test('después de enviar pide abrir los dos correos', async () => {
    (useCambiarCorreo as jest.Mock).mockReturnValue(mutacion({ isSuccess: true, data: 'laura.gomez@correo.co' }));
    await render(<PantallaCambiarCorreo onVolver={jest.fn()} />);

    expect(screen.getByRole('header', { name: 'Revisa tus dos correos' })).toBeTruthy();
    expect(screen.getByText(/laura@correo.co y otro a laura.gomez@correo.co/)).toBeTruthy();
  });

  test('muestra el error del cambio', async () => {
    (useCambiarCorreo as jest.Mock).mockReturnValue(mutacion({ isError: true, error: new Error('Ese correo ya lo usa otra cuenta') }));
    await render(<PantallaCambiarCorreo onVolver={jest.fn()} />);

    expect(screen.getByText('Ese correo ya lo usa otra cuenta')).toBeTruthy();
  });
});

describe('PantallaCambiarContrasena', () => {
  test('pide la actual y la nueva dos veces', async () => {
    const cambiar = mutacion();
    (useCambiarContrasena as jest.Mock).mockReturnValue(cambiar);
    await render(<PantallaCambiarContrasena onVolver={jest.fn()} />);

    await fireEvent.changeText(screen.getByLabelText('Nueva contraseña'), 'nueva1234');
    await fireEvent.changeText(screen.getByLabelText('Confirma la nueva'), 'nueva1234');
    expect(screen.getByRole('button', { name: 'Guardar' })).toBeDisabled();

    await fireEvent.changeText(screen.getByLabelText('Contraseña actual'), 'vieja123');
    await fireEvent.press(screen.getByRole('button', { name: 'Guardar' }));
    expect(cambiar.mutate).toHaveBeenCalledWith({ actual: 'vieja123', nueva: 'nueva1234' });
  });

  test('confirma el cambio o muestra el error', async () => {
    (useCambiarContrasena as jest.Mock).mockReturnValue(mutacion({ isSuccess: true }));
    const { rerender } = await render(<PantallaCambiarContrasena onVolver={jest.fn()} />);
    expect(screen.getByRole('header', { name: 'Listo, cambiaste tu contraseña' })).toBeTruthy();

    (useCambiarContrasena as jest.Mock).mockReturnValue(mutacion({ isError: true, error: new Error('Esa no es tu contraseña actual') }));
    await rerender(<PantallaCambiarContrasena onVolver={jest.fn()} />);
    expect(screen.getByText('Esa no es tu contraseña actual')).toBeTruthy();
  });
});

describe('PantallaEliminarCuenta (RF-DAT-06, RF-DAT-07)', () => {
  test('explica qué se borra y solo elimina al escribir ELIMINAR', async () => {
    const eliminar = mutacion();
    (useEliminarCuenta as jest.Mock).mockReturnValue(eliminar);
    const onEliminada = jest.fn();
    await render(<PantallaEliminarCuenta onVolver={jest.fn()} onEliminada={onEliminada} />);

    expect(screen.getByText(/Tus vehículos/)).toBeTruthy();
    expect(screen.getByText(/retira tu autorización/)).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Eliminar mi cuenta para siempre' })).toBeDisabled();

    await fireEvent.changeText(screen.getByLabelText('Escribe ELIMINAR para confirmar'), 'eliminar');
    await fireEvent.press(screen.getByRole('button', { name: 'Eliminar mi cuenta para siempre' }));

    expect(eliminar.mutate).toHaveBeenCalled();
    expect(onEliminada).toHaveBeenCalled();
  });

  test('con Google y sin identidad confirmada vuelve a pasar por Google', async () => {
    (useSesionReciente as jest.Mock).mockReturnValue(false);
    (useUsuarioDeSesion as jest.Mock).mockReturnValue({ correo: 'laura@gmail.com', conGoogle: true });
    const google = mutacion();
    (useEntrarConGoogle as jest.Mock).mockReturnValue(google);
    (useEliminarCuenta as jest.Mock).mockReturnValue(mutacion({ isError: true, error: new Error('Confirma que eres tú') }));
    await render(<PantallaEliminarCuenta onVolver={jest.fn()} onEliminada={jest.fn()} />);

    await fireEvent.press(screen.getByRole('button', { name: 'Continuar con Google' }));

    expect(google.mutate).toHaveBeenCalledWith('/cuenta/eliminar');
    expect(screen.getByText('Confirma que eres tú')).toBeTruthy();
    expect(screen.queryByLabelText('Escribe ELIMINAR para confirmar')).toBeNull();
  });

  test('sin datos de la sesión pide la contraseña', async () => {
    (useSesionReciente as jest.Mock).mockReturnValue(false);
    (useUsuarioDeSesion as jest.Mock).mockReturnValue(undefined);
    (useEliminarCuenta as jest.Mock).mockReturnValue(mutacion());
    await render(<PantallaEliminarCuenta onVolver={jest.fn()} onEliminada={jest.fn()} />);

    expect(screen.getByLabelText('Tu contraseña actual')).toBeTruthy();
  });
});

describe('PantallaCorreoCambiado (RF-CTA-07)', () => {
  const props = () => ({ tokenHash: 'h', onAbrirApp: jest.fn(), onIniciarSesion: jest.fn() });
  const estado = (valor: Record<string, unknown>) => (useVerificarEnlace as jest.Mock).mockReturnValue(valor);

  test('mientras revisa lo dice', async () => {
    estado({ isPending: true });
    await render(<PantallaCorreoCambiado {...props()} />);
    expect(screen.getByRole('header', { name: 'Revisando el enlace…' })).toBeTruthy();
  });

  test('el primer enlace pide abrir el otro', async () => {
    estado({ isPending: false, isError: false, data: 'falta-otro-enlace' });
    await render(<PantallaCorreoCambiado {...props()} />);
    expect(screen.getByRole('header', { name: 'Falta un paso' })).toBeTruthy();
  });

  test('el segundo termina el cambio', async () => {
    estado({ isPending: false, isError: false, data: 'listo' });
    const p = props();
    await render(<PantallaCorreoCambiado {...p} />);

    await fireEvent.press(screen.getByRole('button', { name: 'Abrir WEVEH' }));
    await fireEvent.press(screen.getByRole('button', { name: 'Iniciar sesión' }));
    expect(p.onAbrirApp).toHaveBeenCalled();
    expect(p.onIniciarSesion).toHaveBeenCalled();
  });

  test('un enlace vencido lo dice', async () => {
    estado({ isPending: false, isError: true });
    await render(<PantallaCorreoCambiado {...props()} />);
    expect(screen.getByRole('header', { name: 'Este enlace venció' })).toBeTruthy();
  });
});
