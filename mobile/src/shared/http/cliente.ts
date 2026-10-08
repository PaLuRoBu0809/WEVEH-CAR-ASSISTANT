import { obtenerDispositivoId } from '@/shared/dispositivo';

import { ErrorApi, ErrorSinConexion, type ProblemDetail } from './errores';

export const HEADER_DISPOSITIVO = 'X-Weveh-Dispositivo';

function urlBase(): string {
  const url = process.env.EXPO_PUBLIC_API_URL;
  if (!url) {
    throw new Error('Falta EXPO_PUBLIC_API_URL (ver mobile/.env.example)');
  }
  return url.replace(/\/+$/, '');
}

/**
 * Llama a la API de WEVEH con el identificador del dispositivo.
 * Lanza ErrorSinConexion si no hay red y ErrorApi con el Problem Details si la respuesta no es exitosa.
 */
export async function pedir<T>(ruta: string, init: RequestInit = {}): Promise<T> {
  const dispositivo = await obtenerDispositivoId();
  const headers = new Headers(init.headers);
  headers.set(HEADER_DISPOSITIVO, dispositivo);
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
    throw new ErrorApi(respuesta.status, await leerProblema(respuesta));
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
