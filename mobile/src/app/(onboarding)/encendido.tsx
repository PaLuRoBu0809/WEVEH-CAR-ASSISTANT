import { router } from 'expo-router';
import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

import { obtenerDispositivoId } from '@/shared/dispositivo';
import { colores, Texto, useTema } from '@/shared/design-system';

const DURACION_MS = 3000;

/** Mockup Portada: punto ámbar + W. Mientras tanto se asegura el dispositivoId (RF-GAR-00). */
export default function Encendido() {
  const tema = useTema();
  const reducirMovimiento = useReducedMotion();
  const brillo = useSharedValue(1);

  useEffect(() => {
    if (!reducirMovimiento) {
      brillo.value = withRepeat(withTiming(0.35, { duration: 700 }), -1, true);
    }
  }, [brillo, reducirMovimiento]);

  useEffect(() => {
    let cancelado = false;
    const espera = new Promise((resolver) => setTimeout(resolver, DURACION_MS));
    Promise.allSettled([obtenerDispositivoId(), espera]).then(() => {
      if (!cancelado) {
        router.replace('/garaje');
      }
    });
    return () => {
      cancelado = true;
    };
  }, []);

  const estiloPunto = useAnimatedStyle(() => ({ opacity: brillo.value }));

  return (
    <View
      style={[estilos.contenedor, { backgroundColor: tema.fondo }]}
      accessible
      accessibilityLabel="WEVEH está encendiendo">
      <Animated.View style={[estilos.punto, estiloPunto]} />
      <Texto variante="titulo" style={estilos.marca}>
        W
      </Texto>
    </View>
  );
}

const estilos = StyleSheet.create({
  contenedor: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  punto: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: colores.oscuro.porVencer,
  },
  marca: {
    fontSize: 64,
    letterSpacing: 2,
  },
});
