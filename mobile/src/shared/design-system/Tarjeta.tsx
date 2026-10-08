import type { ReactNode } from 'react';
import { StyleSheet, View, type ViewStyle } from 'react-native';

import { useTema } from './tema';
import { espacio, radio } from './tokens';

export function Tarjeta({ children, style }: { children: ReactNode; style?: ViewStyle }) {
  const tema = useTema();
  return <View style={[estilos.tarjeta, { backgroundColor: tema.superficie }, style]}>{children}</View>;
}

const estilos = StyleSheet.create({
  tarjeta: { borderRadius: radio.xl, padding: espacio.m, gap: espacio.sm },
});
