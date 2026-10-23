import { fireEvent, render, screen } from '@testing-library/react-native';

import { ErrorApi } from '@/shared/http';
import { useConexion } from '@/shared/sinRed';

import {
  useActualizarKilometraje,
  useCancelarKilometrajeEsperandoRed,
  useCorregirKilometraje,
  useEditarVehiculo,
  useEliminarVehiculo,
  useKilometrajesEsperandoRed,
  useVehiculo,
} from '../application/useVehiculos';
import type { VehiculoResumen } from '../domain/vehiculo';
import { PantallaVehiculo } from './PantallaVehiculo';

jest.mock('react-native-safe-area-context', () => jest.requireActual('react-native-safe-area-context/jest/mock').default);
jest.mock('@/shared/sinRed', () => ({ AvisoSinConexion: () => null, useConexion: jest.fn() }));
jest.mock('expo-crypto', () => ({ randomUUID: () => 'clave-1' }));
jest.mock('../application/useVehiculos', () => ({
  ...jest.requireActual('../application/useVehiculos'),
  useActualizarKilometraje: jest.fn(),
  useCancelarKilometrajeEsperandoRed: jest.fn(),
  useCorregirKilometraje: jest.fn(),
  useEditarVehiculo: jest.fn(),
  useEliminarVehiculo: jest.fn(),
  useKilometrajesEsperandoRed: jest.fn(),
  useVehiculo: jest.fn(),
}));

const HOY = new Date();
const hoyIso = `${HOY.getFullYear()}-${String(HOY.getMonth() + 1).padStart(2, '0')}-${String(HOY.getDate()).padStart(2, '0')}`;

const PALOMO = {
  id: 'v1',
  tipo: 'CARRO',
  alias: 'El palomo',
  marca: 'TOYOTA',
  linea: 'PRADO SUMO TX 3P AT',
  anioModelo: 2011,
  kilometraje: 135000,
  kmActualizadoEn: hoyIso,
  uso: 'MIXTO',
  kmPromedioMes: 1000,
  combustible: null,
  transmision: null,
  traccion: null,
  placa: null,
  fechaMatricula: null,
  datosFaltantes: [],
  versionFila: 0,
} as unknown as VehiculoResumen;

type Opciones = { onSuccess?: () => void };

function mutacion(estado: Record<string, unknown> = {}) {
  return {
    isPending: false,
    isError: false,
    isSuccess: false,
    error: null,
    variables: undefined,
    reset: jest.fn(),
    mutate: jest.fn((_dato: unknown, opciones?: Opciones) => opciones?.onSuccess?.()),
    ...estado,
  };
}

const cancelar = jest.fn();

beforeEach(() => {
  jest.clearAllMocks();
  (useVehiculo as jest.Mock).mockReturnValue({ data: PALOMO, error: null, isPending: false, refetch: jest.fn(), dataUpdatedAt: 1 });
  (useConexion as jest.Mock).mockReturnValue(true);
  (useKilometrajesEsperandoRed as jest.Mock).mockReturnValue(0);
  (useCancelarKilometrajeEsperandoRed as jest.Mock).mockReturnValue(cancelar);
  (useActualizarKilometraje as jest.Mock).mockReturnValue(mutacion());
  (useCorregirKilometraje as jest.Mock).mockReturnValue(mutacion());
  (useEditarVehiculo as jest.Mock).mockReturnValue(mutacion());
  (useEliminarVehiculo as jest.Mock).mockReturnValue(mutacion());
});

const pantalla = () => render(<PantallaVehiculo vehiculoId="v1" onVolver={jest.fn()} onCompletarDatos={jest.fn()} onEliminado={jest.fn()} />);

describe('kilometraje en el detalle del vehículo', () => {
  test('anota una lectura nueva con su clave', async () => {
    const actualizar = mutacion();
    (useActualizarKilometraje as jest.Mock).mockReturnValue(actualizar);
    await pantalla();

    await fireEvent.changeText(screen.getByLabelText('¿Cuánto marca hoy el tablero?'), '136200');
    await fireEvent.press(screen.getByRole('button', { name: 'Actualizar kilometraje' }));

    expect(actualizar.mutate).toHaveBeenCalledWith(
      expect.objectContaining({ vehiculoId: 'v1', kilometraje: 136200, confirmado: false, clave: 'clave-1' }),
      expect.anything(),
    );
  });

  test('sin red avisa que quedó en el celular y deja cancelarlo (RF-GAR-06)', async () => {
    (useConexion as jest.Mock).mockReturnValue(false);
    (useKilometrajesEsperandoRed as jest.Mock).mockReturnValue(1);
    const actualizar = mutacion({ isPending: true });
    (useActualizarKilometraje as jest.Mock).mockReturnValue(actualizar);
    await pantalla();

    expect(screen.getByText(/Quedó anotado en tu celular/)).toBeTruthy();
    expect(screen.queryByText('¿Te equivocaste? Corregir esta lectura')).toBeNull();
    await fireEvent.press(screen.getByRole('button', { name: 'Cancelar' }));

    expect(cancelar).toHaveBeenCalled();
    expect(actualizar.reset).toHaveBeenCalled();
  });

  test('sin red, al anotar se limpia el campo de una vez', async () => {
    (useConexion as jest.Mock).mockReturnValue(false);
    const actualizar = { ...mutacion(), mutate: jest.fn() };
    (useActualizarKilometraje as jest.Mock).mockReturnValue(actualizar);
    await pantalla();

    await fireEvent.changeText(screen.getByLabelText('¿Cuánto marca hoy el tablero?'), '136200');
    await fireEvent.press(screen.getByRole('button', { name: 'Actualizar kilometraje' }));

    expect(screen.getByLabelText('¿Cuánto marca hoy el tablero?').props.value).toBe('');
  });

  test('un salto raro anotado sin red se confirma con el número que se envió', async () => {
    const pregunta = new ErrorApi(409, {
      type: 'https://weveh.co/problemas/confirmacion-requerida',
      detail: 'Subió 15.000 km desde la última vez. ¿Es correcto?',
    });
    const actualizar = mutacion({ error: pregunta, isError: true, variables: { kilometraje: 150000 } });
    (useActualizarKilometraje as jest.Mock).mockReturnValue(actualizar);
    await pantalla();

    await fireEvent.press(screen.getByRole('button', { name: 'Sí, es correcto' }));

    expect(actualizar.mutate).toHaveBeenCalledWith(
      expect.objectContaining({ kilometraje: 150000, confirmado: true }),
      expect.anything(),
    );
  });

  test('corrige la última lectura con un número menor (ADR 0023)', async () => {
    const corregir = mutacion();
    (useCorregirKilometraje as jest.Mock).mockReturnValue(corregir);
    await pantalla();

    await fireEvent.press(screen.getByRole('button', { name: '¿Te equivocaste? Corregir esta lectura' }));
    await fireEvent.changeText(screen.getByLabelText('¿Cuál era el número correcto?'), '136000');
    expect(screen.getByRole('button', { name: 'Guardar corrección' })).toBeDisabled();

    await fireEvent.changeText(screen.getByLabelText('¿Cuál era el número correcto?'), '134000');
    await fireEvent.press(screen.getByRole('button', { name: 'Guardar corrección' }));

    expect(corregir.mutate).toHaveBeenCalledWith(134000, expect.anything());
    expect(screen.queryByLabelText('¿Cuál era el número correcto?')).toBeNull();
  });

  test('muestra el error de la corrección y se puede cancelar', async () => {
    (useCorregirKilometraje as jest.Mock).mockReturnValue(
      mutacion({ error: new ErrorApi(400, { detail: 'No puede quedar por debajo de la lectura anterior: 130.000 km' }) }),
    );
    await pantalla();

    await fireEvent.press(screen.getByRole('button', { name: '¿Te equivocaste? Corregir esta lectura' }));

    expect(screen.getByText(/130.000 km/)).toBeTruthy();
    await fireEvent.press(screen.getAllByRole('button', { name: 'Cancelar' })[0]);
    expect(screen.queryByLabelText('¿Cuál era el número correcto?')).toBeNull();
  });

  test('una lectura de hace más de 7 días ya no se puede corregir', async () => {
    (useVehiculo as jest.Mock).mockReturnValue({
      data: { ...PALOMO, kmActualizadoEn: '2020-01-01' },
      error: null,
      isPending: false,
      refetch: jest.fn(),
      dataUpdatedAt: 1,
    });
    await pantalla();

    expect(screen.queryByText('¿Te equivocaste? Corregir esta lectura')).toBeNull();
  });
});
