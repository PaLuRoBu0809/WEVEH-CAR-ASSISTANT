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

/**
 * RF-GAR-05: con un salto raro responde 409 confirmacion-requerida; se reenvía con confirmado.
 * RF-GAR-06: la clave hace que el cambio se guarde una sola vez aunque se envíe de nuevo, y leidoEn es el día en que
 * se anotó sin red (ADR 0009).
 */
export function actualizarKilometraje(
  id: string,
  kilometraje: number,
  confirmado: boolean,
  envio: Readonly<{ clave?: string; leidoEn?: string }> = {},
): Promise<VehiculoResumen> {
  return pedir<VehiculoResumen>(`${RUTA}/${id}/kilometraje`, {
    method: 'PUT',
    headers: envio.clave ? { 'Idempotency-Key': envio.clave } : undefined,
    body: JSON.stringify({ kilometraje, confirmado, leidoEn: envio.leidoEn }),
  });
}

/** ADR 0023: baja la última lectura, en sus primeros 7 días y sin quedar por debajo de la anterior. Solo con red. */
export function corregirKilometraje(id: string, kilometraje: number): Promise<VehiculoResumen> {
  return pedir<VehiculoResumen>(`${RUTA}/${id}/kilometraje/correccion`, {
    method: 'PUT',
    body: JSON.stringify({ kilometraje }),
  });
}

export function completarRegistro(id: string, datos: RegistroCompletado): Promise<VehiculoResumen> {
  return pedir<VehiculoResumen>(`${RUTA}/${id}/registro`, { method: 'PUT', body: JSON.stringify(datos) });
}

export function eliminarVehiculo(id: string): Promise<void> {
  return pedir<void>(`${RUTA}/${id}`, { method: 'DELETE' });
}
