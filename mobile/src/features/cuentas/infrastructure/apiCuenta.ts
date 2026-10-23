import { pedir } from '@/shared/http';

import type { MedioConsentimiento } from '../domain/formularios';

export type Consentimiento = Readonly<{ versionPolitica: string; aceptadoEn: string; medio: string }>;

export type Cuenta = Readonly<{ nombre: string; correo: string; consentimientos: readonly Consentimiento[] }>;

export type CreacionPerfil = Readonly<{
  nombre: string;
  versionPolitica: string;
  aceptadoEn?: string;
  medio: MedioConsentimiento;
}>;

const RUTA = '/api/v1/cuenta';

export function obtenerCuenta(): Promise<Cuenta> {
  return pedir<Cuenta>(RUTA);
}

export function crearPerfil(datos: CreacionPerfil): Promise<Cuenta> {
  return pedir<Cuenta>(RUTA, { method: 'POST', body: JSON.stringify(datos) });
}

/** RF-CTA-07 / RF-DAT-05. */
export function editarNombre(nombre: string): Promise<Cuenta> {
  return pedir<Cuenta>(RUTA, { method: 'PUT', body: JSON.stringify({ nombre }) });
}

/** RF-DAT-06: borra la cuenta aquí y en Supabase Auth. Exige una sesión de máximo 5 minutos (RF-CTA-05). */
export function eliminarCuenta(): Promise<void> {
  return pedir<void>(RUTA, { method: 'DELETE' });
}
