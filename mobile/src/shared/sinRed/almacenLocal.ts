import Storage from 'expo-sqlite/kv-store';

/**
 * ADR 0009: el último estado de la app y los cambios pendientes viven en SQLite (expo-sqlite/kv-store). La versión web
 * (almacenLocal.web.ts) usa localStorage: SQLite en el navegador pide cabeceras que la demo no tiene.
 */
export const almacenLocal = {
  getItem: (llave: string) => Storage.getItemAsync(llave),
  setItem: (llave: string, valor: string) => Storage.setItemAsync(llave, valor),
  removeItem: async (llave: string) => {
    await Storage.removeItemAsync(llave);
  },
};
