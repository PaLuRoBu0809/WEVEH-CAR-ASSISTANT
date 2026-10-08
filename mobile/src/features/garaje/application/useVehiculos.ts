import { useQuery } from '@tanstack/react-query';

import { listarVehiculos } from '../infrastructure/apiGaraje';

export const CLAVE_VEHICULOS = ['vehiculos'] as const;

export function useVehiculos() {
  return useQuery({ queryKey: CLAVE_VEHICULOS, queryFn: listarVehiculos });
}
