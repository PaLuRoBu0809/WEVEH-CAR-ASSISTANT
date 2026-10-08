import { useColorScheme } from 'react-native';

import { colores, type Paleta } from './tokens';

export function useTema(): Paleta {
  return useColorScheme() === 'light' ? colores.claro : colores.oscuro;
}
