import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';

import { useTema } from './tema';
import { fuentes, radio } from './tokens';

/** Nivel visual de los mockups: Bien (verde), Atención (amarillo), Urgente (rojo). Siempre con texto, no solo color. */
export type Nivel = 'ok' | 'alerta' | 'error';

const TEXTO_POR_DEFECTO: Record<Nivel, string> = { ok: 'Bien', alerta: 'Atención', error: 'Urgente' };

function IconoNivel({ nivel, color }: { nivel: Nivel; color: string }) {
  return (
    <Svg width={16} height={16} viewBox="0 0 16 16" accessibilityElementsHidden>
      {nivel === 'ok' && (
        <>
          <Circle cx={8} cy={8} r={7} fill={color} opacity={0.18} />
          <Path d="M4.5 8.2l2.3 2.3 4.7-4.9" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
        </>
      )}
      {nivel === 'alerta' && (
        <>
          <Path d="M8 1.8l7 12.2H1z" fill={color} opacity={0.18} stroke={color} strokeWidth={1.4} strokeLinejoin="round" />
          <Path d="M8 6v4M8 11.6v.4" stroke={color} strokeWidth={2} strokeLinecap="round" />
        </>
      )}
      {nivel === 'error' && (
        <>
          <Path d="M5 1h6l4 4v6l-4 4H5l-4-4V5z" fill={color} opacity={0.18} stroke={color} strokeWidth={1.4} strokeLinejoin="round" />
          <Path d="M8 4.6v4.2M8 10.8v.4" stroke={color} strokeWidth={2} strokeLinecap="round" />
        </>
      )}
    </Svg>
  );
}

export function Pildora({ nivel, texto }: { nivel: Nivel; texto?: string }) {
  const tema = useTema();
  const fondo = { ok: tema.okTinte, alerta: tema.alertaTinte, error: tema.errorTinte }[nivel];
  const tinta = { ok: tema.okTinta, alerta: tema.alertaTinta, error: tema.errorTinta }[nivel];
  return (
    <View style={[estilos.pildora, { backgroundColor: fondo }]}>
      <IconoNivel nivel={nivel} color={tinta} />
      <Text style={[estilos.textoPildora, { color: tinta }]}>{texto ?? TEXTO_POR_DEFECTO[nivel]}</Text>
    </View>
  );
}

/** Barra de avance 0-100. La de error va rayada en el mockup; aquí se marca con borde para no depender solo del color. */
export function Barra({ porcentaje, nivel }: { porcentaje: number; nivel: Nivel }) {
  const tema = useTema();
  const color = { ok: tema.barraOk, alerta: tema.barraAlerta, error: tema.barraError }[nivel];
  const ancho = Math.max(0, Math.min(100, porcentaje));
  return (
    <View
      accessibilityRole="progressbar"
      accessibilityLabel={`Avance ${Math.round(ancho)} por ciento`}
      accessibilityValue={{ min: 0, max: 100, now: Math.round(ancho) }}
      style={[estilos.pista, { backgroundColor: tema.pista }]}>
      <View style={[estilos.relleno, { width: `${ancho}%`, backgroundColor: color }]} />
    </View>
  );
}

const estilos = StyleSheet.create({
  pildora: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: radio.total,
    paddingVertical: 4,
    paddingLeft: 8,
    paddingRight: 10,
    alignSelf: 'flex-start',
  },
  textoPildora: { fontFamily: fuentes.semi, fontSize: 14 },
  pista: { height: 10, borderRadius: radio.total, overflow: 'hidden' },
  relleno: { height: '100%', borderRadius: radio.total },
});
