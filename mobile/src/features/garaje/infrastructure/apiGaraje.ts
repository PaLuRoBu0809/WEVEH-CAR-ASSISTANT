import { pedir } from '@/shared/http';

import type { EdicionVehiculo, RegistroCompletado, SolicitudRegistro, VehiculoResumen } from '../domain/vehiculo';

const RUTA = '/api/v1/vehiculos';

export function listarVehiculos(): Promise<VehiculoResumen[]> {
  return pedir<VehiculoResumen[]>(RUTA);
}

export function obtenerVehiculo(id: string): Promise<VehiculoResumen> {
  return pedir<VehiculoResumen>(`${RUTA}/${id}`);
}

export function registrarVehiculo(solicitud: SolicitudRegistro): Promise<VehiculoResumen> {
  return pedir<VehiculoResumen>(RUTA, { method: 'POST', body: JSON.stringify(solicitud) });
}

export function editarVehiculo(id: string, edicion: EdicionVehiculo): Promise<VehiculoResumen> {
  return pedir<VehiculoResumen>(`${RUTA}/${id}`, { method: 'PUT', body: JSON.stringify(edicion) });
}

/** RF-GAR-05: con un salto raro responde 409 confirmacion-requerida; se reenvía con confirmado. */
export function actualizarKilometraje(id: string, kilometraje: number, confirmado: boolean): Promise<VehiculoResumen> {
  return pedir<VehiculoResumen>(`${RUTA}/${id}/kilometraje`, {
    method: 'PUT',
    body: JSON.stringify({ kilometraje, confirmado }),
  });
}

export function completarRegistro(id: string, datos: RegistroCompletado): Promise<VehiculoResumen> {
  return pedir<VehiculoResumen>(`${RUTA}/${id}/registro`, { method: 'PUT', body: JSON.stringify(datos) });
}

export function eliminarVehiculo(id: string): Promise<void> {
  return pedir<void>(`${RUTA}/${id}`, { method: 'DELETE' });
}
