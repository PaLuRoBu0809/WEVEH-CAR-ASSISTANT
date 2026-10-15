/** Lo que importa de un error de Supabase Auth (AuthError). */
export type ErrorDeAuth = Readonly<{ code?: string; status?: number; message: string }>;

/** Errores de Supabase Auth en palabras de la persona. Nunca dice si falló el correo o la contraseña. */
export function mensajeDeAuth(error: ErrorDeAuth): string {
  switch (error.code) {
    case 'invalid_credentials':
      return 'Correo o contraseña incorrectos. Revisa los datos e intenta de nuevo.';
    case 'email_not_confirmed':
      return 'Confirma tu correo: abre el enlace que te enviamos y luego inicia sesión.';
    case 'user_already_exists':
    case 'email_exists':
      return 'Ya existe una cuenta con ese correo. Inicia sesión.';
    case 'weak_password':
      return 'Esa contraseña es muy fácil de adivinar. Prueba con otra más larga.';
    case 'over_email_send_rate_limit':
    case 'over_request_rate_limit':
      return 'Hiciste muchos intentos seguidos. Espera unos minutos e intenta de nuevo.';
    default:
      return error.status === 0 || error.status === undefined
        ? 'No pudimos conectarnos. Revisa tu internet e inténtalo de nuevo.'
        : 'No pudimos completar la acción. Inténtalo de nuevo.';
  }
}
