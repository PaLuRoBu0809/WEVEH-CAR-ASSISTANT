import type { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, type ViewStyle } from 'react-native';

import { useTema } from './tema';
import { fuentes, marca, radio, TACTIL_MINIMO } from './tokens';

/**
 * primario: teal lleno · secundario: tinte teal · menta y fantasma: sobre las escenas oscuras de la marca.
 */
type Variante = 'primario' | 'secundario' | 'menta' | 'fantasma';

type Props = {
  texto: string;
  onPress?: () => void;
  variante?: Variante;
  deshabilitado?: boolean;
  ayuda?: string;
  pequeno?: boolean;
  icono?: ReactNode;
  style?: ViewStyle;
};

export function Boton({
  texto,
  onPress,
  variante = 'primario',
  deshabilitado = false,
  ayuda,
  pequeno = false,
  icono,
  style,
}: Props) {
  const tema = useTema();
  const colores = {
    primario: { fondo: tema.primario, presionado: tema.primarioPresionado, tinta: tema.sobrePrimario, borde: undefined },
    secundario: { fondo: tema.primarioTinte, presionado: tema.primarioTinte, tinta: tema.primarioTinta, borde: undefined },
    menta: { fondo: marca.mentaBoton, presionado: marca.mentaBotonPresionado, tinta: marca.sobreMenta, borde: undefined },
    fantasma: { fondo: 'rgba(0,18,15,0.4)', presionado: 'rgba(0,18,15,0.6)', tinta: '#FFFFFF', borde: 'rgba(255,255,255,0.75)' },
  }[variante];

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={texto}
      accessibilityHint={ayuda}
      accessibilityState={{ disabled: deshabilitado }}
      disabled={deshabilitado}
      onPress={onPress}
      style={({ pressed }) => [
        estilos.base,
        pequeno ? estilos.pequeno : estilos.normal,
        variante === 'menta' || variante === 'fantasma' ? estilos.escena : null,
        deshabilitado
          ? { backgroundColor: tema.superficie, borderColor: tema.campo, borderWidth: 1.5, borderStyle: 'dashed' }
          : {
              backgroundColor: pressed ? colores.presionado : colores.fondo,
              borderColor: colores.borde,
              borderWidth: colores.borde ? 1.5 : 0,
            },
        style,
      ]}>
      {icono}
      <Text
        style={[
          estilos.texto,
          { color: deshabilitado ? tema.texto3 : colores.tinta },
          variante === 'menta' || variante === 'fantasma' ? estilos.textoEscena : null,
        ]}>
        {texto}
      </Text>
    </Pressable>
  );
}

const estilos = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 20,
  },
  normal: { minHeight: 52, borderRadius: radio.m, alignSelf: 'stretch' },
  pequeno: { minHeight: TACTIL_MINIMO, borderRadius: radio.m, paddingHorizontal: 16, alignSelf: 'flex-start' },
  escena: { borderRadius: radio.l },
  texto: { fontFamily: fuentes.negrita, fontSize: 15 },
  textoEscena: { fontFamily: fuentes.extra, fontSize: 16 },
});
