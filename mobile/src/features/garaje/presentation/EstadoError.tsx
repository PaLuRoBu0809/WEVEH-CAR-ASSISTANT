import { StyleSheet, View } from 'react-native';

import { Boton, espacio, Texto } from '@/shared/design-system';

type Props = {
  mensaje: string;
  onReintentar: () => void;
};

export function EstadoError({ mensaje, onReintentar }: Props) {
  return (
    <View style={estilos.contenedor} accessibilityLiveRegion="polite">
      <Texto variante="subtitulo">{mensaje}</Texto>
      <Boton texto="Reintentar" onPress={onReintentar} />
    </View>
  );
}

const estilos = StyleSheet.create({
  contenedor: {
    flex: 1,
    justifyContent: 'center',
    gap: espacio.l,
    paddingHorizontal: espacio.l,
  },
});
