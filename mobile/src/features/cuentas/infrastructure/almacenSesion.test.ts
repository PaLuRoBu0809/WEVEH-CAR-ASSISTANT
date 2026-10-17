import { almacenSesion, TAMANO_TROZO } from './almacenSesion';

const mockGuardado = new Map<string, string>();

jest.mock('@/shared/almacen', () => ({
  leer: async (llave: string) => mockGuardado.get(llave) ?? null,
  guardar: async (llave: string, valor: string) => {
    mockGuardado.set(llave, valor);
  },
  borrar: async (llave: string) => {
    mockGuardado.delete(llave);
  },
}));

const LLAVE = 'sb-yrqjxgpskkhjhkkthimm-auth-token';

describe('almacenSesion', () => {
  beforeEach(() => mockGuardado.clear());

  test('una sesión más grande que el límite de SecureStore se guarda en trozos y se recupera igual', async () => {
    const sesion = 'x'.repeat(TAMANO_TROZO * 2 + 10);

    await almacenSesion.setItem(LLAVE, sesion);

    expect(mockGuardado.get(`${LLAVE}.partes`)).toBe('3');
    expect([...mockGuardado.values()].every((valor) => valor.length <= TAMANO_TROZO)).toBe(true);
    await expect(almacenSesion.getItem(LLAVE)).resolves.toBe(sesion);
  });

  test('guardar una sesión más corta no deja trozos viejos', async () => {
    await almacenSesion.setItem(LLAVE, 'y'.repeat(TAMANO_TROZO * 3));
    await almacenSesion.setItem(LLAVE, 'corta');

    expect(mockGuardado.size).toBe(2);
    await expect(almacenSesion.getItem(LLAVE)).resolves.toBe('corta');
  });

  test('cerrar sesión borra todo', async () => {
    await almacenSesion.setItem(LLAVE, 'z'.repeat(TAMANO_TROZO + 1));

    await almacenSesion.removeItem(LLAVE);

    expect(mockGuardado.size).toBe(0);
    await expect(almacenSesion.getItem(LLAVE)).resolves.toBeNull();
  });

  test('sin sesión guardada devuelve null', async () => {
    await expect(almacenSesion.getItem(LLAVE)).resolves.toBeNull();
  });
});
