import { useState } from 'react';
import { StyleSheet, TextInput, View, type TextInputProps, type TextStyle } from 'react-native';

import { Texto } from './Texto';
import { useTema } from './tema';
import { fuentes, radio } from './tokens';

type Props = Omit<TextInputProps, 'style'> & {
  etiqueta: string;
  ayuda?: string;
  error?: string | null;
  estiloEntrada?: TextStyle;
};

/** ".field" del mockup Portada: etiqueta, campo de 52 pt y ayuda o error debajo. */
export function Campo({ etiqueta, ayuda, error, estiloEntrada, ...props }: Props) {
  const tema = useTema();
  const [enfocado, setEnfocado] = useState(false);
  const colorBorde = error ? tema.error : enfocado ? tema.primario : tema.campo;
  return (
    <View style={estilos.campo}>
      <Texto variante="fuerte" style={estilos.etiqueta}>
        {etiqueta}
      </Texto>
      <TextInput
        accessibilityLabel={etiqueta}
        accessibilityHint={error ?? ayuda}
        placeholderTextColor={tema.texto3}
        onFocus={(evento) => {
          setEnfocado(true);
          props.onFocus?.(evento);
        }}
        onBlur={(evento) => {
          setEnfocado(false);
          props.onBlur?.(evento);
        }}
        {...props}
        style={[
          estilos.entrada,
          { borderColor: colorBorde, color: tema.texto, backgroundColor: tema.fondo },
          enfocado && !error ? { borderWidth: 2 } : null,
          estiloEntrada,
        ]}
      />
      {error ? (
        <Texto variante="nota" style={{ color: tema.errorTinta }} accessibilityLiveRegion="polite">
          {error}
        </Texto>
      ) : ayuda ? (
        <Texto variante="nota" tono="texto3">
          {ayuda}
        </Texto>
      ) : null}
    </View>
  );
}

const estilos = StyleSheet.create({
  campo: { gap: 6 },
  etiqueta: { fontSize: 14 },
  entrada: {
    minHeight: 52,
    borderRadius: radio.m,
    borderWidth: 1.5,
    paddingHorizontal: 14,
    fontSize: 16,
    fontFamily: fuentes.normal,
  },
});
