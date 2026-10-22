import {
  confirmaEliminar,
  destinoSeguro,
  errorCorreoNuevo,
  errorNombre,
  esSesionReciente,
  fechaLegible,
  puedeCambiarCorreo,
  textoMedio,
} from './gestionCuenta';

describe('nombre (RF-CTA-07)', () => {
  test('vacío pide escribirlo y largo pide acortarlo', () => {
    expect(errorNombre('   ')).toBe('Escribe tu nombre');
    expect(errorNombre('a'.repeat(81))).toBe('Usa máximo 80 caracteres');
    expect(errorNombre(' Laura Gómez ')).toBeUndefined();
  });
});

describe('correo nuevo (RF-CTA-07)', () => {
  test('vacío no muestra error pero no deja seguir', () => {
    expect(errorCorreoNuevo('', 'ana@correo.co')).toBeUndefined();
    expect(puedeCambiarCorreo('', 'ana@correo.co')).toBe(false);
  });

  test('mal escrito o igual al actual muestra el error', () => {
    expect(errorCorreoNuevo('ana@', 'ana@correo.co')).toContain('Revisa el correo');
    expect(errorCorreoNuevo(' ANA@correo.co ', 'ana@correo.co')).toBe('Ese ya es tu correo');
  });

  test('uno válido y distinto deja seguir', () => {
    expect(puedeCambiarCorreo('ana.gomez@correo.co', 'ana@correo.co')).toBe(true);
  });
});

describe('eliminar mi cuenta (RF-DAT-06)', () => {
  test.each(['ELIMINAR', ' eliminar '])('"%s" habilita el botón', (texto) => {
    expect(confirmaEliminar(texto)).toBe(true);
  });

  test.each(['', 'elimina', 'BORRAR'])('"%s" no lo habilita', (texto) => {
    expect(confirmaEliminar(texto)).toBe(false);
  });
});

describe('sesión reciente (RF-CTA-05)', () => {
  const AHORA = Date.parse('2026-10-22T15:00:00Z');
  const segundos = (ms: number) => ms / 1000;

  test('hasta 4 minutos cuenta como reciente', () => {
    expect(esSesionReciente(segundos(AHORA) - 60, AHORA)).toBe(true);
    expect(esSesionReciente(segundos(AHORA) - 240, AHORA)).toBe(true);
  });

  test('más de 4 minutos o sin dato pide confirmar otra vez', () => {
    expect(esSesionReciente(segundos(AHORA) - 241, AHORA)).toBe(false);
    expect(esSesionReciente(undefined, AHORA)).toBe(false);
  });
});

describe('destino después de confirmar con Google', () => {
  test('solo vuelve a las pantallas de la cuenta', () => {
    expect(destinoSeguro('/cuenta/eliminar')).toBe('/cuenta/eliminar');
    expect(destinoSeguro('https://otro-sitio.com')).toBeUndefined();
    expect(destinoSeguro(undefined)).toBeUndefined();
  });
});

describe('consentimientos en Mis datos (RF-DAT-04)', () => {
  test('la fecha se muestra en la hora de Colombia', () => {
    expect(fechaLegible('2026-10-21T15:00:00Z')).toBe('21 oct 2026');
    expect(fechaLegible('2026-10-22T03:00:00Z')).toBe('21 oct 2026');
    expect(fechaLegible('no es fecha')).toBe('no es fecha');
  });

  test('el medio se dice en palabras', () => {
    expect(textoMedio('APP_GOOGLE')).toBe('al entrar con Google');
    expect(textoMedio('APP_REGISTRO')).toBe('al crear tu cuenta');
    expect(textoMedio('OTRO')).toBe('en la app');
  });
});
