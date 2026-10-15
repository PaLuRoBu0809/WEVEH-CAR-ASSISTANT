import { borrar, guardar, leer } from '@/shared/almacen';

/**
 * SecureStore no garantiza valores de más de 2 KB y una sesión de Supabase puede pasarlos: se guarda en trozos.
 * Cumple la interfaz de almacenamiento que pide supabase-js (getItem, setItem, removeItem).
 */
export const TAMANO_TROZO = 1800;

/** SecureStore solo acepta letras, números, ".", "-" y "_" en la llave. */
function llaveSegura(llave: string): string {
  return llave.replace(/[^A-Za-z0-9._-]/g, '_');
}

const llavePartes = (base: string) => `${base}.partes`;
const llaveTrozo = (base: string, indice: number) => `${base}.${indice}`;

async function cuantasPartes(base: string): Promise<number> {
  const partes = Number(await leer(llavePartes(base)));
  return Number.isInteger(partes) && partes > 0 ? partes : 0;
}

export const almacenSesion = {
  async getItem(llave: string): Promise<string | null> {
    const base = llaveSegura(llave);
    const partes = await cuantasPartes(base);
    if (partes === 0) {
      return null;
    }
    const trozos = await Promise.all(Array.from({ length: partes }, (_, i) => leer(llaveTrozo(base, i))));
    return trozos.some((trozo) => trozo === null) ? null : trozos.join('');
  },

  async setItem(llave: string, valor: string): Promise<void> {
    const base = llaveSegura(llave);
    await almacenSesion.removeItem(llave);
    const trozos: string[] = [];
    for (let inicio = 0; inicio < valor.length; inicio += TAMANO_TROZO) {
      trozos.push(valor.slice(inicio, inicio + TAMANO_TROZO));
    }
    await Promise.all(trozos.map((trozo, i) => guardar(llaveTrozo(base, i), trozo)));
    await guardar(llavePartes(base), String(trozos.length));
  },

  async removeItem(llave: string): Promise<void> {
    const base = llaveSegura(llave);
    const partes = await cuantasPartes(base);
    await Promise.all(Array.from({ length: partes }, (_, i) => borrar(llaveTrozo(base, i))));
    await borrar(llavePartes(base));
  },
};
