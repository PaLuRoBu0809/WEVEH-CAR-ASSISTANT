import { Text, type TextProps } from 'react-native';

import { useTema } from './tema';
import { tipografia } from './tokens';

type Tono = 'texto' | 'texto2' | 'texto3' | 'primarioTinta';

type Props = TextProps & {
  variante?: keyof typeof tipografia;
  tono?: Tono;
};

export function Texto({ variante = 'cuerpo', tono = 'texto', style, ...props }: Props) {
  const tema = useTema();
  return <Text style={[tipografia[variante], { color: tema[tono] }, style]} {...props} />;
}
