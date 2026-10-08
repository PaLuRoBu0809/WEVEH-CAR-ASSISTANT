import { pedir } from '@/shared/http';

import type { Diagnostico } from '../domain/diagnostico';

export function consultarMecanico(vehiculoId: string, sintoma: string): Promise<Diagnostico> {
  return pedir<Diagnostico>(`/api/v1/vehiculos/${vehiculoId}/consultas`, {
    method: 'POST',
    body: JSON.stringify({ sintoma }),
  });
}
