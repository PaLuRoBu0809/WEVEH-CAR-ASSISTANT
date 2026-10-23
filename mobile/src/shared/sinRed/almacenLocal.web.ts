/** Demo web (ADR 0015): el último estado se guarda en el localStorage del navegador. */
export const almacenLocal = {
  getItem: async (llave: string) => globalThis.localStorage?.getItem(llave) ?? null,
  setItem: async (llave: string, valor: string) => {
    globalThis.localStorage?.setItem(llave, valor);
  },
  removeItem: async (llave: string) => {
    globalThis.localStorage?.removeItem(llave);
  },
};
