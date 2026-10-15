import {
  CREAR_CUENTA_INICIAL,
  datosQueFaltan,
  erroresCrearCuenta,
  esCorreoValido,
  puedeIniciarSesion,
  textoQueFalta,
} from './formularios';

const COMPLETO = { nombre: 'Laura', correo: 'laura@correo.com', contrasena: '12345678', aceptaPolitica: true };

describe('crear cuenta', () => {
  test('al empezar faltan los 4 datos', () => {
    expect(datosQueFaltan(CREAR_CUENTA_INICIAL)).toBe(4);
    expect(textoQueFalta(4)).toBe('Faltan 4 datos');
  });

  test('con todo completo se puede crear', () => {
    expect(datosQueFaltan(COMPLETO)).toBe(0);
    expect(textoQueFalta(0)).toBe('Listo para crear tu cuenta');
  });

  test('sin aceptar la política no se puede crear (RF-DAT-01)', () => {
    expect(datosQueFaltan({ ...COMPLETO, aceptaPolitica: false })).toBe(1);
    expect(textoQueFalta(1)).toBe('Falta 1 dato');
  });

  test('una contraseña de menos de 8 caracteres no cuenta y lo explica', () => {
    const datos = { ...COMPLETO, contrasena: '1234567' };

    expect(datosQueFaltan(datos)).toBe(1);
    expect(erroresCrearCuenta(datos).contrasena).toBe('Usa 8 caracteres o más');
  });

  test('un campo vacío no muestra error', () => {
    expect(erroresCrearCuenta(CREAR_CUENTA_INICIAL)).toEqual({ correo: undefined, contrasena: undefined });
  });

  test('un correo sin dominio muestra el error', () => {
    expect(erroresCrearCuenta({ ...COMPLETO, correo: 'laura@' }).correo).toBeDefined();
  });
});

describe('correo e inicio de sesión', () => {
  test.each(['laura@correo.com', '  laura@correo.com.co  '])('%s es válido', (correo) => {
    expect(esCorreoValido(correo)).toBe(true);
  });

  test.each(['', 'laura', 'laura@correo', 'la ura@correo.com'])('"%s" no es válido', (correo) => {
    expect(esCorreoValido(correo)).toBe(false);
  });

  test('para entrar hacen falta correo válido y contraseña', () => {
    expect(puedeIniciarSesion('laura@correo.com', 'x')).toBe(true);
    expect(puedeIniciarSesion('laura@correo.com', '')).toBe(false);
    expect(puedeIniciarSesion('laura', 'x')).toBe(false);
  });
});
