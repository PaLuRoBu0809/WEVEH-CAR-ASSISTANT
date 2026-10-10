import { StyleSheet, View } from 'react-native';

import { Boton, espacio, radio, Texto, useTema } from '@/shared/design-system';

type Props = {
  mensaje: string;
  onReintentar: () => void;
};

export function EstadoError({ mensaje, onReintentar }: Props) {
  const tema = useTema();
  return (
    <View style={estilos.contenedor} accessibilityLiveRegion="polite">
      <View style={[estilos.alerta, { backgroundColor: tema.alertaTinte }]}>
        <Texto variante="fuerte" style={{ color: tema.alertaTinta }}>
          {mensaje}
        </Texto>
      </View>
      <Boton texto="Reintentar" onPress={onReintentar} />
    </View>
  );
}

const estilos = StyleSheet.create({
  contenedor: { gap: espacio.sm },
  alerta: { borderRadius: radio.l, padding: 14 },
});
