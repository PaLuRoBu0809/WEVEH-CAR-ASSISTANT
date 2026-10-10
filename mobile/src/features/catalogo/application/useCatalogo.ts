import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { useEffect, useState } from 'react';

import type { TipoVehiculo } from '../domain/catalogo';
import { buscarLineas, buscarMarcas } from '../infrastructure/apiCatalogo';

const ESPERA_MS = 250;

/** Espera a que la persona deje de escribir para no consultar en cada letra. */
export function useTextoConEspera(texto: string, esperaMs = ESPERA_MS): string {
  const [estable, setEstable] = useState(texto);
  useEffect(() => {
    const reloj = setTimeout(() => setEstable(texto), esperaMs);
    return () => clearTimeout(reloj);
  }, [texto, esperaMs]);
  return estable;
}

export function useMarcas(tipo: TipoVehiculo, texto: string, activo = true) {
  const consulta = useTextoConEspera(texto);
  return useQuery({
    queryKey: ['catalogo', 'marcas', tipo, consulta],
    queryFn: () => buscarMarcas(tipo, consulta),
    enabled: activo && consulta.trim().length >= 2,
    staleTime: 24 * 60 * 60 * 1000,
    placeholderData: keepPreviousData,
  });
}

export function useLineas(marcaId: number | null, tipo: TipoVehiculo, texto: string) {
  const consulta = useTextoConEspera(texto);
  return useQuery({
    queryKey: ['catalogo', 'lineas', marcaId, tipo, consulta],
    queryFn: () => buscarLineas(marcaId as number, tipo, consulta),
    enabled: marcaId !== null,
    staleTime: 24 * 60 * 60 * 1000,
    placeholderData: keepPreviousData,
  });
}
