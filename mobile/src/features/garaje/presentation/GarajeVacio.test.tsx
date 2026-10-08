import { fireEvent, render, screen } from '@testing-library/react-native';

import { GarajeVacio } from './GarajeVacio';

describe('GarajeVacio', () => {
  test('muestra que el garaje está vacío', async () => {
    await render(<GarajeVacio />);

    expect(screen.getByRole('header', { name: 'Tu garaje está vacío' })).toBeTruthy();
  });

  test('sin acción de registro el botón queda deshabilitado', async () => {
    await render(<GarajeVacio />);

    expect(screen.getByRole('button', { name: 'Agregar mi vehículo' })).toBeDisabled();
  });

  test('con acción de registro el botón la ejecuta', async () => {
    const onAgregar = jest.fn();
    await render(<GarajeVacio onAgregar={onAgregar} />);

    fireEvent.press(screen.getByRole('button', { name: 'Agregar mi vehículo' }));

    expect(onAgregar).toHaveBeenCalledTimes(1);
  });
});
