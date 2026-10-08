import { guardar, leer } from '@/shared/almacen';

import { colores } from './tokens';
import { useEstadoTema } from './tema';

jest.mock('@/shared/almacen', () => ({
  leer: jest.fn(),
  guardar: jest.fn().mockResolvedValue(undefined),
}));

const leerSimulado = jest.mocked(leer);
const guardarSimulado = jest.mocked(guardar);

describe('tema', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useEstadoTema.setState({ modo: 'claro' });
  });

  test('abre en claro, como el mockup', () => {
    expect(useEstadoTema.getState().modo).toBe('claro');
  });

  test('recuerda la elección del usuario', () => {
    useEstadoTema.getState().cambiarModo('oscuro');

    expect(useEstadoTema.getState().modo).toBe('oscuro');
    expect(guardarSimulado).toHaveBeenCalledWith('weveh.tema', 'oscuro');
  });

  test('carga el modo guardado al arrancar', async () => {
    leerSimulado.mockResolvedValue('oscuro');

    await useEstadoTema.getState().cargarModoGuardado();

    expect(useEstadoTema.getState().modo).toBe('oscuro');
  });

  test('ignora un valor guardado desconocido', async () => {
    leerSimulado.mockResolvedValue('morado');

    await useEstadoTema.getState().cargarModoGuardado();

    expect(useEstadoTema.getState().modo).toBe('claro');
  });

  test('las dos paletas tienen los mismos tokens', () => {
    expect(Object.keys(colores.oscuro).sort()).toEqual(Object.keys(colores.claro).sort());
  });
});
