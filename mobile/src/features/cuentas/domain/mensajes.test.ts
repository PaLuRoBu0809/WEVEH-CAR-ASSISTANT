import { mensajeDeAuth } from './mensajes';

describe('mensajeDeAuth', () => {
  test('credenciales malas no dicen cuál de los dos datos falló (RF-CTA-02)', () => {
    const mensaje = mensajeDeAuth({ code: 'invalid_credentials', status: 400, message: 'Invalid login credentials' });

    expect(mensaje).toBe('Correo o contraseña incorrectos. Revisa los datos e intenta de nuevo.');
  });

  test('un correo sin confirmar pide abrir el enlace (RF-CTA-04)', () => {
    expect(mensajeDeAuth({ code: 'email_not_confirmed', status: 400, message: '' })).toContain('Confirma tu correo');
  });

  test('un correo que ya tiene cuenta lleva a iniciar sesión (RF-CTA-01)', () => {
    expect(mensajeDeAuth({ code: 'user_already_exists', status: 422, message: '' })).toBe(
      'Ya existe una cuenta con ese correo. Inicia sesión.',
    );
  });

  test('sin red se dice sin jerga', () => {
    expect(mensajeDeAuth({ status: 0, message: 'Network request failed' })).toBe(
      'No pudimos conectarnos. Revisa tu internet e inténtalo de nuevo.',
    );
  });

  test('cualquier otro error no muestra el texto técnico', () => {
    expect(mensajeDeAuth({ code: 'unexpected_failure', status: 500, message: 'database error' })).toBe(
      'No pudimos completar la acción. Inténtalo de nuevo.',
    );
  });
});
