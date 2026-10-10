import type { BottomTabBarProps } from 'expo-router/js-tabs';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  fuentes,
  IconoCarro,
  IconoInicio,
  IconoPerfil,
  IconoPreguntar,
  radio,
  useTema,
} from '@/shared/design-system';

const ICONOS: Record<string, typeof IconoInicio> = {
  inicio: IconoInicio,
  garaje: IconoCarro,
  perfil: IconoPerfil,
};

const AVISO_PREGUNTAR = 'El Mecánico IA llega pronto: primero registramos tu vehículo.';

/** "nav.tabs" y ".fab" del mockup Garaje. */
export function BarraPestanas({ state, descriptors, navigation }: BottomTabBarProps) {
  const tema = useTema();
  const margenes = useSafeAreaInsets();
  const [aviso, setAviso] = useState<string | null>(null);

  useEffect(() => {
    if (!aviso) return;
    const reloj = setTimeout(() => setAviso(null), 2600);
    return () => clearTimeout(reloj);
  }, [aviso]);

  return (
    <View>
      {aviso && (
        <View
          accessibilityLiveRegion="polite"
          style={[estilos.aviso, { backgroundColor: tema.avisoFondo, bottom: 76 + margenes.bottom + 72 }]}>
          <Text style={[estilos.textoAviso, { color: tema.avisoTinta }]}>{aviso}</Text>
        </View>
      )}
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Abrir el asistente"
        onPress={() => setAviso(AVISO_PREGUNTAR)}
        style={({ pressed }) => [
          estilos.flotante,
          { backgroundColor: pressed ? tema.primarioPresionado : tema.primario, bottom: 76 + margenes.bottom },
        ]}>
        <IconoPreguntar color={tema.sobrePrimario} />
        <Text style={[estilos.textoFlotante, { color: tema.sobrePrimario }]}>Preguntar</Text>
      </Pressable>
      <View
        accessibilityRole="tablist"
        style={[
          estilos.barra,
          { backgroundColor: tema.fondo, borderTopColor: tema.linea, paddingBottom: Math.max(8, margenes.bottom) },
        ]}>
        {state.routes.map((ruta, indice) => {
          const enfocada = state.index === indice;
          const { options } = descriptors[ruta.key];
          const titulo = options.title ?? ruta.name;
          const Icono = ICONOS[ruta.name] ?? IconoInicio;
          const color = enfocada ? tema.primarioTinta : tema.texto3;
          return (
            <Pressable
              key={ruta.key}
              accessibilityRole="tab"
              accessibilityState={{ selected: enfocada }}
              accessibilityLabel={titulo}
              onPress={() => {
                const evento = navigation.emit({ type: 'tabPress', target: ruta.key, canPreventDefault: true });
                if (!enfocada && !evento.defaultPrevented) {
                  navigation.navigate(ruta.name, ruta.params);
                }
              }}
              style={[estilos.pestana, enfocada && { borderTopColor: tema.primario }]}>
              <Icono color={color} />
              <Text style={[estilos.textoPestana, { color }]}>{titulo}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const estilos = StyleSheet.create({
  barra: { flexDirection: 'row', borderTopWidth: 1 },
  pestana: {
    flex: 1,
    minHeight: 60,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
    borderTopWidth: 3,
    borderTopColor: 'transparent',
  },
  textoPestana: { fontFamily: fuentes.negrita, fontSize: 14 },
  flotante: {
    position: 'absolute',
    right: 16,
    height: 56,
    minWidth: 56,
    paddingLeft: 16,
    paddingRight: 20,
    borderRadius: radio.total,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    zIndex: 3,
    elevation: 6,
    shadowColor: '#002823',
    shadowOpacity: 0.28,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 4 },
  },
  textoFlotante: { fontFamily: fuentes.negrita, fontSize: 15 },
  aviso: {
    position: 'absolute',
    left: 14,
    right: 14,
    borderRadius: radio.l,
    paddingVertical: 12,
    paddingHorizontal: 14,
    zIndex: 6,
  },
  textoAviso: { fontFamily: fuentes.normal, fontSize: 14 },
});
