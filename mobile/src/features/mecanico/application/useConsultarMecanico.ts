import { useMutation } from '@tanstack/react-query';

import { consultarMecanico } from '../infrastructure/apiMecanico';

export function useConsultarMecanico() {
  return useMutation({
    mutationFn: ({ vehiculoId, sintoma }: { vehiculoId: string; sintoma: string }) => consultarMecanico(vehiculoId, sintoma),
  });
}
