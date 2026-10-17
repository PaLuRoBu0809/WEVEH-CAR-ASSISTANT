import { ErrorApi, ErrorSinConexion, type ProblemDetail } from './errores';

type Sesion = Readonly<{
  /** Token vigente de Supabase Auth, o null si no hay sesión. */
  token: () => Promise<string | null>;
  /** La API respondió 401: la sesión venció o fue revocada. */
  alVencer: () => void;
}>;

const SIN_SESION: Sesion = { token: async () => null, alVencer: () => undefined };

let sesion: Sesion = SIN_SESION;

/**
 * La feature de cuentas registra aquí de dónde sale el token (docs/adr/0005). Así shared no depende de ninguna feature.
 */
export function configurarSesion(nueva: Sesion): void {
  sesion = nueva;
}

function urlBase(): string {
  const url = process.env.EXPO_PUBLIC_API_URL;
  if (!url) {
    throw new Error('Falta EXPO_PUBLIC_API_URL (ver mobile/.env.example)');
  }
  return url.replace(/\/+$/, '');
}

/**
 * Llama a la API de WEVEH con el token de la sesión (Authorization: Bearer).
 * Lanza ErrorSinConexion si no hay red y ErrorApi con el Problem Details si la respuesta no es exitosa.
 */
export async function pedir<T>(ruta: string, init: RequestInit = {}): Promise<T> {
  const token = await sesion.token();
  const headers = new Headers(init.headers);
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }
  headers.set('Accept', 'application/json, application/problem+json');
  if (init.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  let respuesta: Response;
  try {
    respuesta = await fetch(`${urlBase()}${ruta}`, { ...init, headers });
  } catch (error) {
    throw new ErrorSinConexion(error);
  }

  if (!respuesta.ok) {
    const problema = await leerProblema(respuesta);
    if (respuesta.status === 401 && problema.type?.endsWith('/no-autenticado')) {
      sesion.alVencer();
    }
    throw new ErrorApi(respuesta.status, problema);
  }
  if (respuesta.status === 204) {
    return undefined as T;
  }
  return (await respuesta.json()) as T;
}

async function leerProblema(respuesta: Response): Promise<ProblemDetail> {
  try {
    return (await respuesta.json()) as ProblemDetail;
  } catch {
    return { status: respuesta.status };
  }
}
