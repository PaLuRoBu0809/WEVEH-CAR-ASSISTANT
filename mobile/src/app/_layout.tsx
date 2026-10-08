import { JetBrainsMono_500Medium, JetBrainsMono_700Bold } from '@expo-google-fonts/jetbrains-mono';
import {
  Manrope_500Medium,
  Manrope_600SemiBold,
  Manrope_700Bold,
  Manrope_800ExtraBold,
  useFonts,
} from '@expo-google-fonts/manrope';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SplashScreen, Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { useEstadoTema, useTema } from '@/shared/design-system';

SplashScreen.preventAutoHideAsync().catch(() => undefined);

export default function LayoutRaiz() {
  const tema = useTema();
  const modo = useEstadoTema((estado) => estado.modo);
  const cargarModoGuardado = useEstadoTema((estado) => estado.cargarModoGuardado);
  const [temaListo, setTemaListo] = useState(false);
  const [fuentesListas, errorFuentes] = useFonts({
    Manrope_500Medium,
    Manrope_600SemiBold,
    Manrope_700Bold,
    Manrope_800ExtraBold,
    JetBrainsMono_500Medium,
    JetBrainsMono_700Bold,
  });
  const [clienteConsultas] = useState(
    () => new QueryClient({ defaultOptions: { queries: { retry: 1, staleTime: 30_000 } } }),
  );

  useEffect(() => {
    cargarModoGuardado().finally(() => setTemaListo(true));
  }, [cargarModoGuardado]);

  const listo = (fuentesListas || errorFuentes) && temaListo;
  useEffect(() => {
    if (listo) {
      SplashScreen.hideAsync().catch(() => undefined);
    }
  }, [listo]);

  if (!listo) {
    return null;
  }

  return (
    <QueryClientProvider client={clienteConsultas}>
      <SafeAreaProvider>
        <StatusBar style={modo === 'oscuro' ? 'light' : 'dark'} />
        <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: tema.fondo } }}>
          <Stack.Screen name="(onboarding)" options={{ animation: 'fade' }} />
          <Stack.Screen name="(tabs)" options={{ animation: 'fade' }} />
        </Stack>
      </SafeAreaProvider>
    </QueryClientProvider>
  );
}
