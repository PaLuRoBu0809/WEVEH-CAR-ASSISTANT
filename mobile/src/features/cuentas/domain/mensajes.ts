/** Lo que importa de un error de Supabase Auth (AuthError). */
export type ErrorDeAuth = Readonly<{ code?: string; status?: number; message: string }>;

/** Límite de envíos de Supabase: es el único error que "Enlace enviado" muestra (RF-CTA-03). */
export function esLimiteDeEnvios(error: ErrorDeAuth): boolean {
  return error.code === 'over_email_send_rate_limit' || error.code === 'over_request_rate_limit';
}

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
    case 'same_password':
      return 'Esa es la contraseña que ya tenías. Elige una distinta.';
    case 'otp_expired':
    case 'flow_state_expired':
    case 'flow_state_not_found':
      return 'Este enlace venció o ya se usó. Pide otro.';
    default:
      return error.status === 0 || error.status === undefined
        ? 'No pudimos conectarnos. Revisa tu internet e inténtalo de nuevo.'
        : 'No pudimos completar la acción. Inténtalo de nuevo.';
  }
}
