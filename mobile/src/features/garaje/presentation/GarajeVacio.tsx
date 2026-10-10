import { StyleSheet, View } from 'react-native';

import { Boton, espacio, IconoCarro, radio, Texto, useTema } from '@/shared/design-system';

type Props = {
  onAgregar?: () => void;
};

/** RF-GAR-01. Estado vacío con el estilo ".empty" del mockup Garaje. */
export function GarajeVacio({ onAgregar }: Props) {
  const tema = useTema();
  return (
    <View style={estilos.contenedor}>
      <View style={[estilos.vacio, { backgroundColor: tema.superficie }]}>
        <View style={[estilos.icono, { backgroundColor: tema.primarioTinte }]}>
          <IconoCarro color={tema.primarioTinta} tamano={28} />
        </View>
        <Texto variante="subtitulo" accessibilityRole="header" style={estilos.centro}>
          Tu garaje está vacío
        </Texto>
        <Texto variante="nota" tono="texto2" style={estilos.centro}>
          Agrega tu carro o moto y te decimos qué le toca, cuándo vencen tus papeles y qué significa ese ruido raro.
        </Texto>
      </View>
      <Boton
        variante="secundario"
        texto="+ Agregar vehículo"
        onPress={onAgregar}
        deshabilitado={!onAgregar}
        ayuda={onAgregar ? undefined : 'Muy pronto podrás registrar tu vehículo'}
      />
    </View>
  );
}

const estilos = StyleSheet.create({
  contenedor: { gap: espacio.sm },
  vacio: {
    borderRadius: radio.xl,
    paddingVertical: espacio.xl,
    paddingHorizontal: 18,
    alignItems: 'center',
    gap: espacio.s,
  },
  icono: { width: 56, height: 56, borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  centro: { textAlign: 'center' },
});
