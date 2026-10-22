import { fireEvent, render, screen } from '@testing-library/react-native';

import { useCerrarSesion, useCuenta } from '@/features/cuentas';
import { useEstadoTema } from '@/shared/design-system';

import { PantallaPerfil } from './PantallaPerfil';

jest.mock('react-native-safe-area-context', () => jest.requireActual('react-native-safe-area-context/jest/mock').default);
jest.mock('@/features/cuentas', () => ({ useCuenta: jest.fn(), useCerrarSesion: jest.fn() }));

const cerrar = { isPending: false, mutate: jest.fn() };

beforeEach(() => {
  jest.clearAllMocks();
  (useCerrarSesion as jest.Mock).mockReturnValue(cerrar);
  (useCuenta as jest.Mock).mockReturnValue({ data: { nombre: 'Laura', correo: 'laura@correo.co' }, isError: false });
  useEstadoTema.setState({ modo: 'claro' });
});

describe('PantallaPerfil', () => {
  test('la tarjeta de la cuenta abre Mis datos (RF-DAT-04)', async () => {
    const onMisDatos = jest.fn();
    await render(<PantallaPerfil onMisDatos={onMisDatos} />);

    expect(screen.getByText('Laura')).toBeTruthy();
    await fireEvent.press(screen.getByRole('button', { name: 'Mis datos' }));

    expect(onMisDatos).toHaveBeenCalled();
  });

  test('cierra la sesión (RF-CTA-06)', async () => {
    await render(<PantallaPerfil onMisDatos={jest.fn()} />);

    await fireEvent.press(screen.getByRole('button', { name: 'Cerrar sesión' }));

    expect(cerrar.mutate).toHaveBeenCalled();
  });

  test('si no carga la cuenta lo dice', async () => {
    (useCuenta as jest.Mock).mockReturnValue({ data: undefined, isError: true });
    await render(<PantallaPerfil onMisDatos={jest.fn()} />);

    expect(screen.getByText('No pudimos cargar tus datos')).toBeTruthy();
  });
});
