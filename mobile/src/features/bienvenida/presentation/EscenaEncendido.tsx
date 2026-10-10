import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedProps,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Circle, Defs, Path, RadialGradient, Rect, Stop } from 'react-native-svg';

import { marca, TRAZO_W, Texto } from '@/shared/design-system';

const CirculoAnimado = Animated.createAnimatedComponent(Circle);
const TrazoAnimado = Animated.createAnimatedComponent(Path);

/** Largo aproximado del trazo de la W (4 segmentos) para dibujarla con strokeDashoffset. */
const LARGO_W = 71;

/**
 * Mockup Portada → Encendido: el punto ámbar se prende, se dibuja la W y aparece el nombre (≈ 3 s).
 * Con "reducir movimiento" no hay animación: la marca se ve quieta.
 */
export function EscenaEncendido() {
  const reducir = useReducedMotion();
  const punto = useSharedValue(reducir ? 1 : 0);
  const trazo = useSharedValue(reducir ? 0 : LARGO_W);
  const brillo = useSharedValue(reducir ? 0.8 : 0);
  const textos = useSharedValue(reducir ? 1 : 0);

  useEffect(() => {
    if (reducir) {
      return;
    }
    punto.value = withDelay(100, withSequence(withTiming(1.5, { duration: 540 }), withTiming(1, { duration: 360 })));
    trazo.value = withDelay(900, withTiming(0, { duration: 1000, easing: Easing.bezier(0.5, 0, 0.2, 1) }));
    brillo.value = withDelay(1000, withRepeat(withTiming(1, { duration: 1200 }), -1, true));
    textos.value = withDelay(1700, withTiming(1, { duration: 700 }));
  }, [reducir, punto, trazo, brillo, textos]);

  const propsPunto = useAnimatedProps(() => ({ r: 5 * punto.value, opacity: Math.min(1, punto.value * 2) }));
  const propsTrazo = useAnimatedProps(() => ({ strokeDashoffset: trazo.value }));
  const propsBrillo = useAnimatedProps(() => ({ opacity: 0.55 + 0.45 * brillo.value, r: 24 * (1 + 0.18 * brillo.value) }));
  const estiloTextos = useAnimatedStyle(() => ({
    opacity: textos.value,
    transform: [{ translateY: 8 * (1 - textos.value) }],
  }));

  return (
    <View style={estilos.contenedor} accessible accessibilityLabel="WEVEH, tu vehículo al día">
      <Svg style={StyleSheet.absoluteFill} preserveAspectRatio="xMidYMid slice" viewBox="0 0 100 100">
        <Defs>
          <RadialGradient id="fondo" cx="50%" cy="44%" r="75%">
            <Stop offset="0" stopColor={marca.tealBrillo} />
            <Stop offset="0.55" stopColor={marca.tealProfundo} />
            <Stop offset="1" stopColor={marca.tealOscuro} />
          </RadialGradient>
        </Defs>
        <Rect width="100" height="100" fill="url(#fondo)" />
      </Svg>
      <Svg width={150} height={150} viewBox="0 0 64 64" fill="none">
        <Defs>
          <RadialGradient id="resplandor">
            <Stop offset="0" stopColor={marca.sol} stopOpacity={0.95} />
            <Stop offset="0.5" stopColor={marca.sol} stopOpacity={0.3} />
            <Stop offset="1" stopColor={marca.sol} stopOpacity={0} />
          </RadialGradient>
        </Defs>
        <CirculoAnimado cx={32} cy={18} fill="url(#resplandor)" animatedProps={propsBrillo} />
        <TrazoAnimado
          d={TRAZO_W}
          stroke="#FFFFFF"
          strokeWidth={6}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeDasharray={LARGO_W}
          animatedProps={propsTrazo}
        />
        <CirculoAnimado cx={32} cy={18} fill={marca.sol} animatedProps={propsPunto} />
      </Svg>
      <Animated.View style={[estilos.textos, estiloTextos]}>
        <Texto style={estilos.nombre}>weveh</Texto>
        <Texto variante="nota" style={{ color: marca.textoEscena2 }}>
          Tu vehículo al día
        </Texto>
      </Animated.View>
    </View>
  );
}

const estilos = StyleSheet.create({
  contenedor: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: marca.tealProfundo },
  textos: { alignItems: 'center', gap: 10, marginTop: 8 },
  nombre: { color: '#FFFFFF', fontFamily: 'Manrope_800ExtraBold', fontSize: 44, lineHeight: 48, letterSpacing: -0.9 },
});
