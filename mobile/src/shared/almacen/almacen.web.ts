/**
 * Respaldo para probar en el navegador del PC durante el desarrollo: expo-secure-store no existe en web.
 * La versión web no es parte del MVP; localStorage no es almacenamiento seguro.
 */
export async function leer(llave: string): Promise<string | null> {
  return globalThis.localStorage?.getItem(llave) ?? null;
}

export async function guardar(llave: string, valor: string): Promise<void> {
  globalThis.localStorage?.setItem(llave, valor);
}
