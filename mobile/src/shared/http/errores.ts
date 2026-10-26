/** Problem Details (RFC 9457) que devuelve la API. */
export type ProblemDetail = Readonly<{
  type?: string;
  title?: string;
  status?: number;
  detail?: string;
  instance?: string;
}>;

export class ErrorApi extends Error {
  readonly status: number;
  readonly problema: ProblemDetail;

  constructor(status: number, problema: ProblemDetail) {
    super(problema.detail ?? problema.title ?? `Error ${status}`);
    this.name = 'ErrorApi';
    this.status = status;
    this.problema = problema;
  }
}

export class ErrorSinConexion extends Error {
  constructor(causa?: unknown) {
    super('No hay conexión con WEVEH', { cause: causa });
    this.name = 'ErrorSinConexion';
  }
}

/** ADR 0010: un módulo apagado a propósito o la IA llena dicen lo que pasa, no "un problema de nuestro lado". */
const MENSAJES_503: Readonly<Record<string, string>> = {
  'modulo-inactivo': 'Esta función está en mantenimiento. Vuelve a intentarlo más tarde; lo demás de WEVEH sigue funcionando.',
  'mucha-demanda': 'Hay mucha demanda en este momento. Intenta de nuevo en un minuto.',
};

/** Texto sin jerga para mostrar en pantalla. */
export function mensajeParaPersona(error: unknown): string {
  if (error instanceof ErrorSinConexion) {
    return 'No pudimos conectarnos. Revisa tu internet e inténtalo de nuevo.';
  }
  const tipo503 = error instanceof ErrorApi && error.status === 503 ? error.problema.type?.split('/').pop() : undefined;
  if (tipo503 && MENSAJES_503[tipo503]) {
    return MENSAJES_503[tipo503];
  }
  if (error instanceof ErrorApi && error.status >= 500) {
    return 'Tuvimos un problema de nuestro lado. Inténtalo en un momento.';
  }
  if (error instanceof ErrorApi) {
    return error.problema.detail ?? error.problema.title ?? 'No pudimos completar la acción.';
  }
  return 'Algo salió mal. Inténtalo de nuevo.';
}
