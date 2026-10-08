import { useEffect, useState } from 'react';

import { useVehiculos } from '@/features/garaje';
import { obtenerDispositivoId } from '@/shared/dispositivo';

export const DURACION_ENCENDIDO_MS = 3200;

export type Destino = '/portada' | '/inicio' | '/garaje';

/**
 * Tras el encendido: si ya hay vehículos va a Inicio; si el garaje está vacío, a la portada;
 * si no hay conexión, al garaje (que muestra el error y permite reintentar).
 */
export function useDestinoInicial(): Destino | null {
  const [tiempoCumplido, setTiempoCumplido] = useState(false);
  const [dispositivoListo, setDispositivoListo] = useState(false);
  const vehiculos = useVehiculos();

  useEffect(() => {
    const reloj = setTimeout(() => setTiempoCumplido(true), DURACION_ENCENDIDO_MS);
    obtenerDispositivoId().finally(() => setDispositivoListo(true));
    return () => clearTimeout(reloj);
  }, []);

  if (!tiempoCumplido || !dispositivoListo || vehiculos.isPending) {
    return null;
  }
  if (vehiculos.isError) {
    return '/garaje';
  }
  return vehiculos.data.length > 0 ? '/inicio' : '/portada';
}
