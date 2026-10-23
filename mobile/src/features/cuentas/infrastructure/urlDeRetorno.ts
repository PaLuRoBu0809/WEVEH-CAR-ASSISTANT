import * as Linking from 'expo-linking';
import { Platform } from 'react-native';

/**
 * A dónde vuelve la persona después de entrar con Google (docs/adr/0022). En la demo web, a la misma página; en el
 * celular, a la app (weveh:// instalada o exp:// en Expo Go).
 * @param parametros por ejemplo { siguiente: '/cuenta/eliminar' } al confirmar la identidad (RF-CTA-05)
 */
export function urlDeRetorno(ruta: string, parametros?: Readonly<Record<string, string>>): string {
  if (Platform.OS === 'web') {
    const consulta = parametros ? `?${new URLSearchParams(parametros).toString()}` : '';
    return `${window.location.origin}/${ruta}${consulta}`;
  }
  return Linking.createURL(ruta, parametros ? { queryParams: parametros } : undefined);
}

/** Abre WEVEH en el celular desde una página de la demo web. Si no está instalada, no pasa nada. */
export const ENLACE_APP = 'weveh://';
