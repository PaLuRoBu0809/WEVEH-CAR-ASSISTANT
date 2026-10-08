import { pedir } from '@/shared/http';

import type { LineaCatalogo, MarcaCatalogo, TipoVehiculo } from '../domain/catalogo';

function consulta(parametros: Record<string, string | undefined>): string {
  const pares = Object.entries(parametros).filter((par): par is [string, string] => Boolean(par[1]));
  return pares.length ? `?${new URLSearchParams(pares).toString()}` : '';
}

export function buscarMarcas(tipo: TipoVehiculo, texto: string): Promise<MarcaCatalogo[]> {
  return pedir<MarcaCatalogo[]>(`/api/v1/catalogo/marcas${consulta({ tipo, q: texto.trim() })}`);
}

export function buscarLineas(marcaId: number, tipo: TipoVehiculo, texto: string): Promise<LineaCatalogo[]> {
  return pedir<LineaCatalogo[]>(`/api/v1/catalogo/marcas/${marcaId}/lineas${consulta({ tipo, q: texto.trim() })}`);
}
