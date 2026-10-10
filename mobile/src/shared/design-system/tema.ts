import { create } from 'zustand';

import { guardar, leer } from '@/shared/almacen';

import { colores, type Paleta } from './tokens';

export type ModoTema = 'claro' | 'oscuro';

const LLAVE_TEMA = 'weveh.tema';

type EstadoTema = {
  modo: ModoTema;
  cambiarModo: (modo: ModoTema) => void;
  cargarModoGuardado: () => Promise<void>;
};

/** Como el mockup: siempre abre en claro y la elección del usuario se recuerda. */
export const useEstadoTema = create<EstadoTema>((set) => ({
  modo: 'claro',
  cambiarModo: (modo) => {
    set({ modo });
    guardar(LLAVE_TEMA, modo).catch(() => undefined);
  },
  cargarModoGuardado: async () => {
    const guardado = await leer(LLAVE_TEMA).catch(() => null);
    if (guardado === 'claro' || guardado === 'oscuro') {
      set({ modo: guardado });
    }
  },
}));

export function useTema(): Paleta {
  const modo = useEstadoTema((estado) => estado.modo);
  return colores[modo];
}
