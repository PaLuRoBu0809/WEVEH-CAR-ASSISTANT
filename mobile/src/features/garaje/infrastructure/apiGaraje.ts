import { pedir } from '@/shared/http';

import type { SolicitudRegistro, VehiculoResumen } from '../domain/vehiculo';

export function listarVehiculos(): Promise<VehiculoResumen[]> {
  return pedir<VehiculoResumen[]>('/api/v1/vehiculos');
}

export function registrarVehiculo(solicitud: SolicitudRegistro): Promise<VehiculoResumen> {
  return pedir<VehiculoResumen>('/api/v1/vehiculos', { method: 'POST', body: JSON.stringify(solicitud) });
}

export function eliminarVehiculo(id: string): Promise<void> {
  return pedir<void>(`/api/v1/vehiculos/${id}`, { method: 'DELETE' });
}
