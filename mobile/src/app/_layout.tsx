import { JetBrainsMono_500Medium, JetBrainsMono_700Bold } from '@expo-google-fonts/jetbrains-mono';
import {
  Manrope_500Medium,
  Manrope_600SemiBold,
  Manrope_700Bold,
  Manrope_800ExtraBold,
  useFonts,
} from '@expo-google-fonts/manrope';
import { QueryClient } from '@tanstack/react-query';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import { SplashScreen, Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { usePrepararSesion } from '@/features/cuentas';
import { prepararCambiosSinRed } from '@/features/garaje';
import { useEstadoTema, useTema } from '@/shared/design-system';
import { conectarDetectorDeRed, EDAD_MAXIMA_MS, opcionesPersistencia } from '@/shared/sinRed';

SplashScreen.preventAutoHideAsync().catch(() => undefined);
conectarDetectorDeRed();

/**
 * ADR 0009: lo guardado dura hasta 30 días (gcTime igual a la edad máxima) y los cambios fallan de una vez sin red,
 * salvo el kilometraje, que espera la red (prepararCambiosSinRed).
 */
function crearClienteConsultas(): QueryClient {
  const cliente = new QueryClient({
    defaultOptions: {
      queries: { retry: 1, staleTime: 30_000, gcTime: EDAD_MAXIMA_MS },
      mutations: { networkMode: 'always' },
    },
  });
  prepararCambiosSinRed(cliente);
  return cliente;
}

export default function LayoutRaiz() {
  usePrepararSesion();
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
  const [clienteConsultas] = useState(crearClienteConsultas);

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
    <PersistQueryClientProvider
      client={clienteConsultas}
      persistOptions={opcionesPersistencia}
      // Lo que quedó esperando red se envía apenas haya conexión, y luego se recarga lo guardado
      onSuccess={() => clienteConsultas.resumePausedMutations().then(() => clienteConsultas.invalidateQueries())}>
      <SafeAreaProvider>
        <StatusBar style={modo === 'oscuro' ? 'light' : 'dark'} />
        <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: tema.fondo } }}>
          <Stack.Screen name="(onboarding)" options={{ animation: 'fade' }} />
          <Stack.Screen name="(tabs)" options={{ animation: 'fade' }} />
        </Stack>
      </SafeAreaProvider>
    </PersistQueryClientProvider>
  );
}
