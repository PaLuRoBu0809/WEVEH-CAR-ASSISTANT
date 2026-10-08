import { pedir } from '@/shared/http';

import type { VehiculoResumen } from '../domain/vehiculo';

export function listarVehiculos(): Promise<VehiculoResumen[]> {
  return pedir<VehiculoResumen[]>('/api/v1/vehiculos');
}
