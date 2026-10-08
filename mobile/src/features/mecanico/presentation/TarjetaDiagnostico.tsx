import { StyleSheet, View } from 'react-native';

import { espacio, Pildora, radio, Tarjeta, Texto, useTema } from '@/shared/design-system';

import { nivelVisual, nombrePieza, type Diagnostico } from '../domain/diagnostico';

/** Resultado del asistente en el mockup Garaje: gravedad con barra de 3, alerta y qué hacer. */
export function TarjetaDiagnostico({ diagnostico: d }: { diagnostico: Diagnostico }) {
  const tema = useTema();
  const nivel = nivelVisual(d.nivel);
  const tramos = [tema.barraOk, nivel === 'ok' ? tema.pista : tema.barraAlerta, nivel === 'error' ? tema.barraError : tema.pista];
  const alerta = { fondo: nivel === 'error' ? tema.errorTinte : tema.alertaTinte, tinta: nivel === 'error' ? tema.errorTinta : tema.alertaTinta };

  return (
    <View style={estilos.contenedor} accessibilityLiveRegion="polite">
      <View>
        <Texto variante="nota" tono="texto3">
          Diagnóstico
        </Texto>
        <Texto variante="titulo" accessibilityRole="header">
          {d.posibleFalla}
        </Texto>
      </View>

      <Tarjeta>
        <View style={estilos.fila}>
          <Texto variante="fuerte">Gravedad</Texto>
          <Pildora nivel={nivel} texto={d.gravedad} />
        </View>
        <View style={estilos.tramos} accessibilityElementsHidden>
          {tramos.map((color, i) => (
            <View key={i} style={[estilos.tramo, { backgroundColor: color }]} />
          ))}
        </View>
        <Texto tono="texto2">{d.explicacionSimple}</Texto>
      </Tarjeta>

      <View style={[estilos.alerta, { backgroundColor: alerta.fondo }]}>
        <Texto variante="fuerte" style={{ color: alerta.tinta }}>
          {d.requiereMecanico ? 'Llévalo al mecánico' : 'Qué hacer ahora'}
        </Texto>
        <Texto style={{ color: alerta.tinta }}>{d.accionInmediata}</Texto>
      </View>

      {d.costoEstimado && (
        <View style={estilos.fila}>
          <Texto tono="texto2">Costo de referencia</Texto>
          <Texto variante="fuerte">{d.costoEstimado}</Texto>
        </View>
      )}

      {d.piezasRelacionadas.length > 0 && (
        <View style={estilos.piezas}>
          {d.piezasRelacionadas.map((pieza) => (
            <View key={pieza} style={[estilos.pieza, { backgroundColor: tema.primarioTinte }]}>
              <Texto variante="nota" tono="primarioTinta">
                {nombrePieza(pieza)}
              </Texto>
            </View>
          ))}
        </View>
      )}

      {d.datosFaltantes.length > 0 && (
        <Texto variante="nota" tono="texto2">
          Para orientarte mejor nos ayudaría saber: {d.datosFaltantes.join(', ')}.
        </Texto>
      )}

      <Texto variante="nota" tono="texto3" style={estilos.aviso}>
        {d.aviso}.
      </Texto>
    </View>
  );
}

const estilos = StyleSheet.create({
  contenedor: { gap: espacio.sm },
  fila: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: espacio.s },
  tramos: { flexDirection: 'row', gap: 6 },
  tramo: { flex: 1, height: 8, borderRadius: radio.total },
  alerta: { borderRadius: radio.l, padding: 14, gap: 4 },
  piezas: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  pieza: { borderRadius: radio.total, paddingHorizontal: 10, paddingVertical: 3 },
  aviso: { textAlign: 'center', marginTop: espacio.s },
});
