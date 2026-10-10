import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useTema } from './tema';
import { fuentes, radio, TACTIL_MINIMO } from './tokens';

type Opcion<T extends string> = { valor: T; texto: string };

type Props<T extends string> = {
  etiqueta: string;
  opciones: readonly Opcion<T>[];
  valor: T | null;
  onCambiar: (valor: T) => void;
};

/** ".chip" del mockup: una sola opción elegida, con aria-pressed. */
export function Opciones<T extends string>({ etiqueta, opciones, valor, onCambiar }: Props<T>) {
  const tema = useTema();
  return (
    <View style={estilos.fila} accessibilityRole="radiogroup" accessibilityLabel={etiqueta}>
      {opciones.map((opcion) => {
        const activa = opcion.valor === valor;
        return (
          <Pressable
            key={opcion.valor}
            accessibilityRole="radio"
            accessibilityState={{ checked: activa }}
            accessibilityLabel={opcion.texto}
            onPress={() => onCambiar(opcion.valor)}
            style={[
              estilos.chip,
              {
                borderColor: activa ? tema.primario : tema.campo,
                backgroundColor: activa ? tema.primarioTinte : tema.fondo,
              },
            ]}>
            <Text style={[estilos.texto, { color: activa ? tema.primarioTinta : tema.texto2 }]}>{opcion.texto}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const estilos = StyleSheet.create({
  fila: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    minHeight: TACTIL_MINIMO,
    borderRadius: radio.total,
    borderWidth: 1,
    paddingHorizontal: 16,
    justifyContent: 'center',
  },
  texto: { fontFamily: fuentes.semi, fontSize: 15 },
});
