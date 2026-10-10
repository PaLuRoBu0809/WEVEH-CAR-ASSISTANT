import { Pressable, StyleSheet, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { Texto } from './Texto';
import { useTema } from './tema';
import { TACTIL_MINIMO } from './tokens';

type Props = {
  texto: string;
  marcada: boolean;
  onCambiar: (marcada: boolean) => void;
};

/** ".chk" del mockup: casilla de 24 pt con su texto, nunca premarcada. */
export function Casilla({ texto, marcada, onCambiar }: Props) {
  const tema = useTema();
  return (
    <Pressable
      accessibilityRole="checkbox"
      accessibilityState={{ checked: marcada }}
      accessibilityLabel={texto}
      onPress={() => onCambiar(!marcada)}
      style={estilos.fila}>
      <View
        style={[
          estilos.caja,
          { borderColor: marcada ? tema.primario : tema.campo, backgroundColor: marcada ? tema.primario : tema.fondo },
        ]}>
        {marcada && (
          <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
            <Path d="M20 6L9 17l-5-5" stroke={tema.sobrePrimario} strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" />
          </Svg>
        )}
      </View>
      <Texto tono="texto2" style={estilos.texto}>
        {texto}
      </Texto>
    </Pressable>
  );
}

const estilos = StyleSheet.create({
  fila: { flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: TACTIL_MINIMO },
  caja: { width: 24, height: 24, borderRadius: 6, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  texto: { flex: 1 },
});
