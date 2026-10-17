import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { ErrorApi } from '@/shared/http';

import type { EdicionVehiculo, RegistroCompletado, SolicitudRegistro } from '../domain/vehiculo';
import {
  actualizarKilometraje,
  completarRegistro,
  editarVehiculo,
  eliminarVehiculo,
  listarVehiculos,
  obtenerVehiculo,
  registrarVehiculo,
} from '../infrastructure/apiGaraje';

export const CLAVE_VEHICULOS = ['vehiculos'] as const;

/** @param habilitado false mientras no haya sesión: sin token la API respondería 401 */
export function useVehiculos(habilitado = true) {
  return useQuery({ queryKey: CLAVE_VEHICULOS, queryFn: listarVehiculos, enabled: habilitado });
}

export function useVehiculo(id: string) {
  return useQuery({ queryKey: [...CLAVE_VEHICULOS, id], queryFn: () => obtenerVehiculo(id) });
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

export function useActualizarKilometraje(id: string) {
  return useCambioDeVehiculo(({ kilometraje, confirmado }: { kilometraje: number; confirmado: boolean }) =>
    actualizarKilometraje(id, kilometraje, confirmado),
  );
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
