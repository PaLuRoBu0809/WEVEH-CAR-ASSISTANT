import * as SecureStore from 'expo-secure-store';

/** Almacenamiento seguro del celular (Keychain en iOS, Keystore en Android). */
export function leer(llave: string): Promise<string | null> {
  return SecureStore.getItemAsync(llave);
}

export function guardar(llave: string, valor: string): Promise<void> {
  return SecureStore.setItemAsync(llave, valor);
}
