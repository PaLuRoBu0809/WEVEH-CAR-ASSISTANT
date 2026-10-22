import { StyleSheet, View } from 'react-native';

import { espacio, radio, Texto, useTema } from '@/shared/design-system';

import { POLITICA, type BloquePolitica } from '../domain/politica';
import { Formulario } from './Formulario';

type Props = Readonly<{ onVolver?: () => void }>;

/** Mockup 8 · Política (RF-DAT-01), en la app y en la demo web. La etiqueta "Borrador" se ve siempre. */
export function PantallaPolitica({ onVolver }: Props) {
  const tema = useTema();
  return (
    <Formulario titulo={POLITICA.titulo} onVolver={onVolver}>
      <View style={[estilos.etiqueta, { backgroundColor: tema.alertaTinte }]}>
        <Texto variante="fuerte" style={{ color: tema.alertaTinta }}>
          Borrador
        </Texto>
      </View>
      <Texto variante="nota" tono="texto2">
        {POLITICA.aviso}
      </Texto>
      {POLITICA.secciones.map((seccion) => (
        <View key={seccion.titulo} style={estilos.seccion}>
          <Texto variante="subtitulo" accessibilityRole="header">
            {seccion.titulo}
          </Texto>
          {seccion.bloques.map((bloque, indice) => (
            <Bloque key={indice} bloque={bloque} />
          ))}
        </View>
      ))}
    </Formulario>
  );
}

function Bloque({ bloque }: Readonly<{ bloque: BloquePolitica }>) {
  if ('parrafo' in bloque) {
    return <Texto tono="texto2">{bloque.parrafo}</Texto>;
  }
  return (
    <View style={estilos.lista}>
      {bloque.lista.map((elemento) => (
        <Texto key={elemento} tono="texto2">
          {`•  ${elemento}`}
        </Texto>
      ))}
    </View>
  );
}

const estilos = StyleSheet.create({
  etiqueta: { alignSelf: 'flex-start', borderRadius: radio.s, paddingHorizontal: espacio.sm, paddingVertical: 4 },
  seccion: { gap: espacio.s },
  lista: { gap: 6 },
});
