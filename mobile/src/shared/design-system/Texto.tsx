import { Text, type TextProps } from 'react-native';

import { useTema } from './tema';
import { tipografia } from './tokens';

type Props = TextProps & {
  variante?: keyof typeof tipografia;
  suave?: boolean;
};

export function Texto({ variante = 'cuerpo', suave = false, style, ...props }: Props) {
  const tema = useTema();
  return (
    <Text
      style={[tipografia[variante], { color: suave ? tema.textoSuave : tema.texto }, style]}
      {...props}
    />
  );
}
