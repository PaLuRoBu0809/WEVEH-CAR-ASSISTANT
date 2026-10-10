import { useEffect } from 'react';
import { StyleSheet } from 'react-native';
import Animated, { Easing, useAnimatedProps, useReducedMotion, useSharedValue, withTiming } from 'react-native-reanimated';
import Svg, { Circle, Defs, G, LinearGradient, Path, Polygon, Polyline, RadialGradient, Rect, Stop } from 'react-native-svg';

import { marca, TRAZO_W } from '@/shared/design-system';

const GrupoAnimado = Animated.createAnimatedComponent(G);

const ANCHO = 372;
const ALTO = 780;
const HORIZONTE = 400;

/** Trazos de la línea central, del horizonte hacia el usuario (mockup: sceneRoad). */
const TRAZOS = [0.02, 0.07, 0.14, 0.23, 0.34, 0.47, 0.62, 0.8].map((inicio, i) => {
  const largo = [0.03, 0.04, 0.055, 0.07, 0.09, 0.115, 0.14, 0.13][i];
  const fin = Math.min(1, inicio + largo);
  const recorrido = ALTO - HORIZONTE;
  const y0 = HORIZONTE + recorrido * inicio;
  const y1 = HORIZONTE + recorrido * fin;
  const w0 = 1 + 14 * inicio;
  const w1 = 1 + 14 * fin;
  return {
    puntos: `${186 - w0},${y0} ${186 + w0},${y0} ${186 + w1},${y1} ${186 - w1},${y1}`,
    opacidad: 0.35 + 0.55 * inicio,
  };
});

/** Portada: la carretera del arte con el sol que sube al fondo. */
export function EscenaCarretera() {
  const reducir = useReducedMotion();
  const subida = useSharedValue(reducir ? 1 : 0);

  useEffect(() => {
    if (!reducir) {
      subida.value = withTiming(1, { duration: 1600, easing: Easing.bezier(0.2, 0.7, 0.2, 1) });
    }
  }, [reducir, subida]);

  const propsSol = useAnimatedProps(() => ({
    opacity: 0.1 + 0.9 * subida.value,
    transform: [{ translateY: 44 * (1 - subida.value) }],
  }));

  return (
    <Svg
      style={StyleSheet.absoluteFill}
      viewBox={`0 0 ${ANCHO} ${ALTO}`}
      preserveAspectRatio="xMidYMid slice"
      accessibilityElementsHidden>
      <Defs>
        <LinearGradient id="cielo" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor={marca.cielo} />
          <Stop offset="0.62" stopColor={marca.cieloMedio} />
          <Stop offset="1" stopColor={marca.horizonte} />
        </LinearGradient>
        <RadialGradient id="halo" gradientUnits="userSpaceOnUse" cx={186} cy={HORIZONTE} r={330}>
          <Stop offset="0" stopColor={marca.sol} stopOpacity={0.3} />
          <Stop offset="0.4" stopColor={marca.sol} stopOpacity={0.1} />
          <Stop offset="1" stopColor={marca.sol} stopOpacity={0} />
        </RadialGradient>
        <RadialGradient id="nucleo" gradientUnits="userSpaceOnUse" cx={186} cy={HORIZONTE} r={130}>
          <Stop offset="0" stopColor={marca.sol} stopOpacity={0.75} />
          <Stop offset="0.4" stopColor={marca.sol} stopOpacity={0.28} />
          <Stop offset="1" stopColor={marca.sol} stopOpacity={0} />
        </RadialGradient>
        <LinearGradient id="velo" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#000C0A" stopOpacity={0} />
          <Stop offset="1" stopColor="#000C0A" stopOpacity={0.92} />
        </LinearGradient>
      </Defs>
      <Rect width={ANCHO} height={HORIZONTE} fill="url(#cielo)" />
      <Rect y={HORIZONTE} width={ANCHO} height={ALTO - HORIZONTE} fill="#031513" />
      <Circle cx={186} cy={HORIZONTE} r={330} fill="url(#halo)" />
      <Circle cx={186} cy={HORIZONTE} r={130} fill="url(#nucleo)" />
      <G transform={`translate(18.6,${HORIZONTE - 212}) scale(5.2)`} opacity={0.07}>
        <Path d={TRAZO_W} fill="none" stroke="#FFFFFF" strokeWidth={6} strokeLinecap="round" strokeLinejoin="round" />
      </G>
      <Polygon points={`164,${HORIZONTE} 208,${HORIZONTE} 366,${ALTO} 6,${ALTO}`} fill="#0A2623" />
      <Polyline points={`164,${HORIZONTE} 6,${ALTO}`} stroke={marca.menta} strokeWidth={3} fill="none" opacity={0.7} />
      <Polyline points={`208,${HORIZONTE} 366,${ALTO}`} stroke={marca.menta} strokeWidth={3} fill="none" opacity={0.7} />
      {TRAZOS.map((trazo) => (
        <Polygon key={trazo.puntos} points={trazo.puntos} fill={marca.sol} opacity={trazo.opacidad} />
      ))}
      <GrupoAnimado animatedProps={propsSol}>
        <Circle cx={186} cy={HORIZONTE} r={20} fill={marca.sol} />
      </GrupoAnimado>
      <Rect y={ALTO - 260} width={ANCHO} height={260} fill="url(#velo)" />
    </Svg>
  );
}
