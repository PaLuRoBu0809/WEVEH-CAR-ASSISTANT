import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import type { Conversacion, Mensaje } from '../domain/diagnostico';
import {
  crearConversacion,
  enviarMensaje,
  listarConversaciones,
  transcribir,
  verConversacion,
} from '../infrastructure/apiMecanico';

/** Sin meta guardarSinRed: la conversación necesita red y no se guarda en el celular. */
export const claveConversaciones = (vehiculoId: string) => ['mecanico', 'conversaciones', vehiculoId] as const;
export const claveConversacion = (vehiculoId: string, conversacionId: string) =>
  ['mecanico', 'conversacion', vehiculoId, conversacionId] as const;

export function useConversaciones(vehiculoId: string | undefined) {
  return useQuery({
    queryKey: claveConversaciones(vehiculoId ?? ''),
    queryFn: () => listarConversaciones(vehiculoId as string),
    enabled: Boolean(vehiculoId),
  });
}

export function useConversacion(vehiculoId: string | undefined, conversacionId: string | null) {
  return useQuery({
    queryKey: claveConversacion(vehiculoId ?? '', conversacionId ?? ''),
    queryFn: () => verConversacion(vehiculoId as string, conversacionId as string),
    enabled: Boolean(vehiculoId && conversacionId),
  });
}

/**
 * RF-MIA-02: envía un mensaje; si todavía no hay conversación, la crea primero. Al responder, agrega los dos mensajes
 * a la conversación en memoria sin volver a pedirla.
 */
export function useEnviarMensaje(vehiculoId: string | undefined) {
  const cliente = useQueryClient();
  return useMutation({
    mutationFn: async ({ conversacionId, texto }: { conversacionId: string | null; texto: string }) => {
      if (!vehiculoId) throw new Error('Falta el vehículo');
      const id = conversacionId ?? (await crearConversacion(vehiculoId)).id;
      const respuesta = await enviarMensaje(vehiculoId, id, texto);
      return { conversacionId: id, texto, respuesta };
    },
    onSuccess: ({ conversacionId, texto, respuesta }) => {
      if (!vehiculoId) return;
      const ahora = new Date().toISOString();
      const nuevos: Mensaje[] = [
        { rol: 'PERSONA', texto, tarjeta: null, creado: ahora },
        { rol: 'MECANICO', texto: respuesta.respuesta, tarjeta: respuesta.tarjeta, creado: ahora },
      ];
      cliente.setQueryData<Conversacion>(claveConversacion(vehiculoId, conversacionId), (anterior) => ({
        id: conversacionId,
        mensajes: [...(anterior?.mensajes ?? []), ...nuevos],
      }));
      void cliente.invalidateQueries({ queryKey: claveConversaciones(vehiculoId) });
    },
  });
}

/** RF-MIA-11: el texto vuelve al campo para corregirlo antes de enviarlo. */
export function useTranscribir() {
  return useMutation({ mutationFn: (uri: string) => transcribir(uri) });
}
