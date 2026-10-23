import {
  onlineManager,
  useMutation,
  useMutationState,
  useQuery,
  useQueryClient,
  type QueryClient,
} from '@tanstack/react-query';
import { randomUUID } from 'expo-crypto';

import { hoyIso } from '@/shared/fechas';
import { ErrorApi } from '@/shared/http';

import type { EdicionVehiculo, RegistroCompletado, SolicitudRegistro, VehiculoResumen } from '../domain/vehiculo';
import {
  actualizarKilometraje,
  completarRegistro,
  corregirKilometraje,
  editarVehiculo,
  eliminarVehiculo,
  listarVehiculos,
  obtenerVehiculo,
  registrarVehiculo,
} from '../infrastructure/apiGaraje';

export const CLAVE_VEHICULOS = ['vehiculos'] as const;

/** Cambios de kilometraje: los únicos que se pueden hacer sin red (RF-GAR-06, ADR 0009). */
export const CLAVE_CAMBIO_KILOMETRAJE = ['cambio-kilometraje'] as const;

/** Lo que se envía y se guarda en el celular mientras no hay red. */
export type CambioKilometraje = Readonly<{
  vehiculoId: string;
  kilometraje: number;
  confirmado: boolean;
  /** Idempotency-Key: el backend lo guarda una sola vez aunque llegue dos veces. */
  clave: string;
  /** Día en que se anotó, solo si se anotó sin red: el backend descarta lecturas viejas ("gana lo último"). */
  leidoEn?: string;
}>;

/** @param habilitado false mientras no haya sesión: sin token la API respondería 401 */
export function useVehiculos(habilitado = true) {
  return useQuery({
    queryKey: CLAVE_VEHICULOS,
    queryFn: listarVehiculos,
    enabled: habilitado,
    meta: { guardarSinRed: true },
  });
}

export function useVehiculo(id: string) {
  return useQuery({
    queryKey: [...CLAVE_VEHICULOS, id],
    queryFn: () => obtenerVehiculo(id),
    meta: { guardarSinRed: true },
  });
}

/**
 * Se llama una vez al crear el cliente de consultas, antes de recuperar lo guardado: un cambio que quedó esperando red
 * se envía al volver la conexión aunque la app se haya cerrado entre tanto.
 */
export function prepararCambiosSinRed(consultas: QueryClient): void {
  consultas.setMutationDefaults(CLAVE_CAMBIO_KILOMETRAJE, {
    mutationFn: (cambio: CambioKilometraje) =>
      actualizarKilometraje(cambio.vehiculoId, cambio.kilometraje, cambio.confirmado, {
        clave: cambio.clave,
        leidoEn: cambio.leidoEn,
      }),
    networkMode: 'online',
    meta: { guardarSinRed: true },
    onMutate: (cambio: CambioKilometraje) => mostrarYa(consultas, cambio),
    onSettled: () => consultas.invalidateQueries({ queryKey: CLAVE_VEHICULOS }),
  });
}

/** Lo que se veía antes del cambio, para devolverlo si la persona cancela un kilometraje que espera red. */
type Anterior = Readonly<{ detalle?: VehiculoResumen; lista?: VehiculoResumen[] }>;

/** Sin esperar al servidor: el kilometraje nuevo se ve de una vez, también sin red. Nunca baja. */
function mostrarYa(consultas: QueryClient, cambio: CambioKilometraje): Anterior {
  const claveDetalle = [...CLAVE_VEHICULOS, cambio.vehiculoId];
  const anterior: Anterior = {
    detalle: consultas.getQueryData<VehiculoResumen>(claveDetalle),
    lista: consultas.getQueryData<VehiculoResumen[]>(CLAVE_VEHICULOS),
  };
  const subir = (vehiculo: VehiculoResumen): VehiculoResumen =>
    vehiculo.id === cambio.vehiculoId && cambio.kilometraje > vehiculo.kilometraje
      ? { ...vehiculo, kilometraje: cambio.kilometraje }
      : vehiculo;
  consultas.setQueryData<VehiculoResumen>(claveDetalle, (actual) => actual && subir(actual));
  consultas.setQueryData<VehiculoResumen[]>(CLAVE_VEHICULOS, (actuales) => actuales?.map(subir));
  return anterior;
}

/**
 * "Cancelar" junto a un kilometraje que espera red: sale de la cola y vuelve a verse el número de antes. Sirve
 * también para lo que quedó pendiente de antes de cerrar la app.
 */
export function useCancelarKilometrajeEsperandoRed(vehiculoId: string) {
  const consultas = useQueryClient();
  return () => {
    const cola = consultas.getMutationCache();
    const esperando = cola.findAll({
      mutationKey: [...CLAVE_CAMBIO_KILOMETRAJE, vehiculoId],
      predicate: (cambio) => cambio.state.isPaused,
    });
    const primero = esperando[0]?.state.context as Anterior | undefined;
    esperando.forEach((cambio) => cola.remove(cambio));
    if (primero?.detalle) {
      consultas.setQueryData([...CLAVE_VEHICULOS, vehiculoId], primero.detalle);
    }
    if (primero?.lista) {
      consultas.setQueryData(CLAVE_VEHICULOS, primero.lista);
    }
  };
}

/** ADR 0023: "Me equivoqué al anotarlo". Solo con red: falla de una vez si no hay. */
export function useCorregirKilometraje(vehiculoId: string) {
  return useCambioDeVehiculo((kilometraje: number) => corregirKilometraje(vehiculoId, kilometraje));
}

/** Arma el cambio con su clave; si no hay red, anota el día para que el backend sepa qué tan vieja es la lectura. */
export function nuevoCambioKilometraje(vehiculoId: string, kilometraje: number, confirmado: boolean): CambioKilometraje {
  return {
    vehiculoId,
    kilometraje,
    confirmado,
    clave: randomUUID(),
    leidoEn: onlineManager.isOnline() ? undefined : hoyIso(),
  };
}

/** RF-GAR-05 y RF-GAR-06. Sin red queda en pausa (isPaused) y se envía solo al volver la conexión. */
export function useActualizarKilometraje(vehiculoId: string) {
  return useMutation<VehiculoResumen, Error, CambioKilometraje>({
    mutationKey: [...CLAVE_CAMBIO_KILOMETRAJE, vehiculoId],
  });
}

/** Cuántos kilometrajes de este vehículo esperan red, también los que quedaron de antes de cerrar la app. */
export function useKilometrajesEsperandoRed(vehiculoId: string): number {
  return useMutationState({
    filters: { mutationKey: [...CLAVE_CAMBIO_KILOMETRAJE, vehiculoId], predicate: (cambio) => cambio.state.isPaused },
  }).length;
}

/** Tras cualquier cambio se recargan la lista y el detalle (comparten el prefijo de la clave). */
function useCambioDeVehiculo<T>(cambio: (datos: T) => Promise<unknown>) {
  const consultas = useQueryClient();
  return useMutation({
    mutationFn: cambio,
    onSuccess: () => consultas.invalidateQueries({ queryKey: CLAVE_VEHICULOS }),
  });
}

export function useRegistrarVehiculo() {
  const consultas = useQueryClient();
  return useMutation({
    mutationFn: (solicitud: SolicitudRegistro) => registrarVehiculo(solicitud),
    onSuccess: () => consultas.invalidateQueries({ queryKey: CLAVE_VEHICULOS }),
  });
}

export function useEditarVehiculo(id: string) {
  return useCambioDeVehiculo((edicion: EdicionVehiculo) => editarVehiculo(id, edicion));
}

export function useCompletarRegistro(id: string) {
  return useCambioDeVehiculo((datos: RegistroCompletado) => completarRegistro(id, datos));
}

export function useEliminarVehiculo() {
  const consultas = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => eliminarVehiculo(id),
    onSuccess: () => consultas.invalidateQueries({ queryKey: CLAVE_VEHICULOS }),
  });
}

/** El backend pide confirmar un salto raro del kilometraje (409 confirmacion-requerida). */
export function pideConfirmacion(error: unknown): error is ErrorApi {
  return error instanceof ErrorApi && error.problema.type?.endsWith('/confirmacion-requerida') === true;
}
