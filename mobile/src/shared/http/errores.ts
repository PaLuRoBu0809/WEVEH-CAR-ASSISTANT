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

/** Texto sin jerga para mostrar en pantalla. */
export function mensajeParaPersona(error: unknown): string {
  if (error instanceof ErrorSinConexion) {
    return 'No pudimos conectarnos. Revisa tu internet e inténtalo de nuevo.';
  }
  if (error instanceof ErrorApi && error.status >= 500) {
    return 'Tuvimos un problema de nuestro lado. Inténtalo en un momento.';
  }
  if (error instanceof ErrorApi) {
    return error.problema.title ?? 'No pudimos completar la acción.';
  }
  return 'Algo salió mal. Inténtalo de nuevo.';
}
