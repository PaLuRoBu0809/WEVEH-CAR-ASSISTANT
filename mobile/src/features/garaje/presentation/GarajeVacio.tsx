import { StyleSheet, View } from 'react-native';

import { Boton, espacio, Texto } from '@/shared/design-system';

type Props = {
  onAgregar?: () => void;
};

/** RF-GAR-01. El registro llega en la fase 1 (RF-GAR-02); mientras tanto el botón queda deshabilitado. */
export function GarajeVacio({ onAgregar }: Props) {
  return (
    <View style={estilos.contenedor}>
      <Texto variante="titulo" accessibilityRole="header">
        Tu garaje está vacío
      </Texto>
      <Texto suave style={estilos.explicacion}>
        Agrega tu carro o moto y te decimos qué le toca, cuándo vencen tus papeles y qué significa ese ruido raro.
      </Texto>
      <Boton
        texto="Agregar mi vehículo"
        onPress={onAgregar}
        deshabilitado={!onAgregar}
        ayuda={onAgregar ? undefined : 'Muy pronto podrás registrar tu vehículo'}
      />
    </View>
  );
}

const estilos = StyleSheet.create({
  contenedor: {
    flex: 1,
    justifyContent: 'center',
    gap: espacio.m,
    paddingHorizontal: espacio.l,
  },
  explicacion: {
    marginBottom: espacio.m,
  },
});
