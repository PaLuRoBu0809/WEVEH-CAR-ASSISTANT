import { Tabs } from 'expo-router';

import { useTema } from '@/shared/design-system';

/** Fase 0: solo Garaje. Inicio, Preguntar y Combustible llegan en sus fases. */
export default function LayoutPestanas() {
  const tema = useTema();
  return (
    <Tabs
      screenOptions={{
        headerStyle: { backgroundColor: tema.fondo },
        headerTintColor: tema.texto,
        tabBarStyle: { backgroundColor: tema.superficie, borderTopColor: tema.borde },
        tabBarActiveTintColor: tema.accion,
        tabBarInactiveTintColor: tema.textoSuave,
        sceneStyle: { backgroundColor: tema.fondo },
      }}>
      <Tabs.Screen name="garaje" options={{ title: 'Garaje' }} />
    </Tabs>
  );
}
