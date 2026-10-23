import * as Sentry from '@sentry/react-native';

/**
 * ADR 0010 y RNF-23: los errores de la app van al proyecto weveh-app de Sentry (organización weveh-group). Sin
 * EXPO_PUBLIC_SENTRY_DSN no se inicia nada. Nunca van datos de la persona: ni usuario, ni IP, ni lo que escribe.
 */

/** Lo que importa de un evento de Sentry para limpiarlo. */
type EventoSentry = {
  user?: unknown;
  request?: { headers?: unknown; cookies?: unknown; data?: unknown; query_string?: unknown };
};

/** Se aplica a cada evento antes de enviarlo: deja solo lo técnico del error. */
export function limpiarEvento<T extends EventoSentry>(evento: T): T {
  delete evento.user;
  if (evento.request) {
    delete evento.request.headers;
    delete evento.request.cookies;
    delete evento.request.data;
    delete evento.request.query_string;
  }
  return evento;
}

/** Se llama una vez al abrir la app. @returns si quedó encendido */
export function iniciarMonitoreo(dsn = process.env.EXPO_PUBLIC_SENTRY_DSN): boolean {
  if (!dsn) {
    return false;
  }
  Sentry.init({
    dsn,
    environment: process.env.EXPO_PUBLIC_SENTRY_ENTORNO ?? 'desarrollo',
    sendDefaultPii: false,
    attachScreenshot: false,
    attachViewHierarchy: false,
    tracesSampleRate: 0,
    beforeSend: (evento) => limpiarEvento(evento),
  });
  return true;
}
