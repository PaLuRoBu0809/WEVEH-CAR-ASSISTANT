import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import type { SolicitudRegistro } from '../domain/vehiculo';
import { eliminarVehiculo, listarVehiculos, registrarVehiculo } from '../infrastructure/apiGaraje';

export const CLAVE_VEHICULOS = ['vehiculos'] as const;

export function useVehiculos() {
  return useQuery({ queryKey: CLAVE_VEHICULOS, queryFn: listarVehiculos });
}

export function useRegistrarVehiculo() {
  const consultas = useQueryClient();
  return useMutation({
    mutationFn: (solicitud: SolicitudRegistro) => registrarVehiculo(solicitud),
    onSuccess: () => consultas.invalidateQueries({ queryKey: CLAVE_VEHICULOS }),
  });
}

export function useEliminarVehiculo() {
  const consultas = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => eliminarVehiculo(id),
    onSuccess: () => consultas.invalidateQueries({ queryKey: CLAVE_VEHICULOS }),
  });
}
