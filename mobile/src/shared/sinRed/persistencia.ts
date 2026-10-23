import NetInfo from '@react-native-community/netinfo';
import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister';
import { onlineManager, type Mutation, type Query } from '@tanstack/react-query';
import type { PersistQueryClientOptions } from '@tanstack/react-query-persist-client';

import { almacenLocal } from './almacenLocal';

/**
 * ADR 0009: TanStack Query guarda en el celular las consultas marcadas con `meta: { guardarSinRed: true }` y los
 * cambios que quedaron esperando red (por ahora, el kilometraje). Al abrir la app sin red se ve lo último que se
 * supo, y los cambios se envían solos cuando vuelve la conexión.
 */
declare module '@tanstack/react-query' {
  interface Register {
    queryMeta: { guardarSinRed?: boolean };
    mutationMeta: { guardarSinRed?: boolean };
  }
}

/** Lo guardado se descarta si tiene más de 30 días sin abrir la app. */
export const EDAD_MAXIMA_MS = 30 * 24 * 60 * 60 * 1000;

/** Cambiarla descarta lo guardado (cuando cambie la forma de los datos). */
const VERSION_GUARDADO = '1';

const persistidor = createAsyncStoragePersister({
  storage: almacenLocal,
  key: 'weveh-ultimo-estado',
  throttleTime: 1000,
});

export function debeGuardarConsulta(consulta: Query): boolean {
  return consulta.state.status === 'success' && consulta.meta?.guardarSinRed === true;
}

/** Solo los cambios que esperan red; uno que ya falló no se reintenta al abrir la app. */
export function debeGuardarCambio(cambio: Mutation): boolean {
  return cambio.state.isPaused && cambio.meta?.guardarSinRed === true;
}

export const opcionesPersistencia: Omit<PersistQueryClientOptions, 'queryClient'> = {
  persister: persistidor,
  maxAge: EDAD_MAXIMA_MS,
  buster: VERSION_GUARDADO,
  dehydrateOptions: { shouldDehydrateQuery: debeGuardarConsulta, shouldDehydrateMutation: debeGuardarCambio },
};

/** RF-CTA-06 y RNF-26: al cerrar sesión o eliminar la cuenta no queda nada de la persona en el celular. */
export async function borrarDatosLocales(): Promise<void> {
  await persistidor.removeClient();
}

/** TanStack Query sabe si hay red por NetInfo (en el celular no hay eventos del navegador). Se llama una vez. */
export function conectarDetectorDeRed(): void {
  onlineManager.setEventListener((cambiarEstado) =>
    NetInfo.addEventListener((estado) => cambiarEstado(estado.isConnected !== false)),
  );
}
