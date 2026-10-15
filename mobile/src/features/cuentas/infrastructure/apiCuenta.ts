import { pedir } from '@/shared/http';

export type Consentimiento = Readonly<{ versionPolitica: string; aceptadoEn: string; medio: string }>;

export type Cuenta = Readonly<{ nombre: string; correo: string; consentimientos: readonly Consentimiento[] }>;

export type CreacionPerfil = Readonly<{ nombre: string; versionPolitica: string; aceptadoEn?: string }>;

const RUTA = '/api/v1/cuenta';

export function obtenerCuenta(): Promise<Cuenta> {
  return pedir<Cuenta>(RUTA);
}

export function crearPerfil(datos: CreacionPerfil): Promise<Cuenta> {
  return pedir<Cuenta>(RUTA, { method: 'POST', body: JSON.stringify(datos) });
}
