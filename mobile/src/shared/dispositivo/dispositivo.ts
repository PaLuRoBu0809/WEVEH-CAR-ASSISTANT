import * as Crypto from 'expo-crypto';

import { guardar, leer } from '@/shared/almacen';
import { esUuidV4 } from './esUuidV4';

export const LLAVE_DISPOSITIVO = 'weveh.dispositivoId';

let enMemoria: Promise<string> | null = null;

/**
 * Identificador del dispositivo (UUID v4) que se envía en X-Weveh-Dispositivo.
 * Se genera en el primer arranque y vive en SecureStore. No es autenticación: ver docs/adr/0002.
 */
export function obtenerDispositivoId(): Promise<string> {
  if (!enMemoria) {
    enMemoria = leerOGenerar().catch((error: unknown) => {
      enMemoria = null;
      throw error;
    });
  }
  return enMemoria;
}

async function leerOGenerar(): Promise<string> {
  const guardado = await leer(LLAVE_DISPOSITIVO);
  if (esUuidV4(guardado)) {
    return guardado.toLowerCase();
  }
  const nuevo = Crypto.randomUUID().toLowerCase();
  await guardar(LLAVE_DISPOSITIVO, nuevo);
  return nuevo;
}

/** Solo para pruebas. */
export function olvidarDispositivoEnMemoria(): void {
  enMemoria = null;
}
