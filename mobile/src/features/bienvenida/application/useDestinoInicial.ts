import { useEffect, useState } from 'react';

import { useEstadoSesion } from '@/features/cuentas';
import { useVehiculos } from '@/features/garaje';

export const DURACION_ENCENDIDO_MS = 3200;

export type Destino = '/portada' | '/inicio' | '/garaje';

/**
 * Tras el encendido: sin sesión va a la portada (crear cuenta o entrar). Con sesión: si ya hay vehículos va a Inicio;
 * si el garaje está vacío o no hay conexión, al garaje (que invita a registrar uno o permite reintentar).
 */
export function useDestinoInicial(): Destino | null {
  const [tiempoCumplido, setTiempoCumplido] = useState(false);
  const sesion = useEstadoSesion();
  const vehiculos = useVehiculos(sesion === 'con-sesion');

  useEffect(() => {
    const reloj = setTimeout(() => setTiempoCumplido(true), DURACION_ENCENDIDO_MS);
    return () => clearTimeout(reloj);
  }, []);

  if (!tiempoCumplido || sesion === 'cargando') {
    return null;
  }
  if (sesion === 'sin-sesion') {
    return '/portada';
  }
  if (vehiculos.isPending) {
    return null;
  }
  if (vehiculos.isError) {
    return '/garaje';
  }
  return vehiculos.data.length > 0 ? '/inicio' : '/garaje';
}
