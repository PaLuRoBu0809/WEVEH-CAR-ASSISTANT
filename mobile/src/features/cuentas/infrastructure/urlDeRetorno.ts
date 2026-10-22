import * as Linking from 'expo-linking';
import { Platform } from 'react-native';

/**
 * A dónde vuelve la persona después de entrar con Google (docs/adr/0022). En la demo web, a la misma página; en el
 * celular, a la app (weveh:// instalada o exp:// en Expo Go).
 */
export function urlDeRetorno(ruta: string): string {
  if (Platform.OS === 'web') {
    return `${window.location.origin}/${ruta}`;
  }
  return Linking.createURL(ruta);
}

/** Abre WEVEH en el celular desde una página de la demo web. Si no está instalada, no pasa nada. */
export const ENLACE_APP = 'weveh://';
