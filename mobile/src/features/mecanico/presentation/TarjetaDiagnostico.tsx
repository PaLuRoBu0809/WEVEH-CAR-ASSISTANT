import { StyleSheet, View } from 'react-native';

import { espacio, Pildora, radio, Tarjeta, Texto, useTema } from '@/shared/design-system';

import { nivelVisual, nombrePieza, type Diagnostico } from '../domain/diagnostico';
import { respuestasDelPlazo } from '../domain/plazo';

/** Resultado del asistente en el mockup Garaje: gravedad con barra de 3, plazo (RF-MIA-08), alerta y qué hacer. */
export function TarjetaDiagnostico({ diagnostico: d }: { diagnostico: Diagnostico }) {
  const tema = useTema();
  const nivel = nivelVisual(d.nivel);
  const tramos = [tema.barraOk, nivel === 'ok' ? tema.pista : tema.barraAlerta, nivel === 'error' ? tema.barraError : tema.pista];
  const alerta = { fondo: nivel === 'error' ? tema.errorTinte : tema.alertaTinte, tinta: nivel === 'error' ? tema.errorTinta : tema.alertaTinta };
  const plazo = respuestasDelPlazo(d.plazo);

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
        <Texto variante="fuerte">¿Por qué importa?</Texto>
        <Texto tono="texto2">{d.porQueImporta}</Texto>
      </Tarjeta>

      <View style={[estilos.plazo, { backgroundColor: alerta.fondo }]} accessibilityLabel={d.textoPlazo}>
        <View style={estilos.pregunta}>
          <Texto variante="nota" style={{ color: alerta.tinta }}>
            ¿Puedo seguir manejando?
          </Texto>
          <Texto variante="fuerte" style={{ color: alerta.tinta }}>
            {plazo.manejar}
          </Texto>
        </View>
        <View style={estilos.pregunta}>
          <Texto variante="nota" style={{ color: alerta.tinta }}>
            ¿Cuándo debo llevarlo?
          </Texto>
          <Texto variante="fuerte" style={{ color: alerta.tinta }}>
            {plazo.cuando}
          </Texto>
        </View>
      </View>

      <View style={[estilos.alerta, { backgroundColor: alerta.fondo }]}>
        <Texto variante="fuerte" style={{ color: alerta.tinta }}>
          {d.requiereMecanico ? 'Llévalo al mecánico' : 'Qué hacer'}
        </Texto>
        {d.pasos.map((paso, indice) => (
          <Texto key={paso} style={{ color: alerta.tinta }}>
            {d.pasos.length > 1 ? `${indice + 1}. ` : ''}
            {paso}
          </Texto>
        ))}
      </View>

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
  plazo: { borderRadius: radio.l, padding: 14, flexDirection: 'row', gap: espacio.m },
  pregunta: { flex: 1, gap: 2 },
  piezas: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  pieza: { borderRadius: radio.total, paddingHorizontal: 10, paddingVertical: 3 },
  aviso: { textAlign: 'center', marginTop: espacio.s },
});
