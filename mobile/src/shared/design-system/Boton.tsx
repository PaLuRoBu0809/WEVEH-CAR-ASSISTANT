import { Pressable, StyleSheet } from 'react-native';

import { Texto } from './Texto';
import { useTema } from './tema';
import { espacio, radio, TACTIL_MINIMO } from './tokens';

type Props = {
  texto: string;
  onPress?: () => void;
  deshabilitado?: boolean;
  ayuda?: string;
};

export function Boton({ texto, onPress, deshabilitado = false, ayuda }: Props) {
  const tema = useTema();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={texto}
      accessibilityHint={ayuda}
      accessibilityState={{ disabled: deshabilitado }}
      disabled={deshabilitado}
      onPress={onPress}
      style={({ pressed }) => [
        estilos.boton,
        { backgroundColor: tema.accion, opacity: deshabilitado ? 0.45 : pressed ? 0.8 : 1 },
      ]}>
      <Texto variante="subtitulo" style={{ color: tema.textoSobreAccion, fontSize: 17 }}>
        {texto}
      </Texto>
    </Pressable>
  );
}

const estilos = StyleSheet.create({
  boton: {
    minHeight: TACTIL_MINIMO,
    paddingHorizontal: espacio.l,
    paddingVertical: espacio.m - 4,
    borderRadius: radio.total,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
