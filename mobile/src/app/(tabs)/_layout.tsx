import { Tabs } from 'expo-router/js-tabs';

import { BarraPestanas } from '@/shared/navegacion';

/** Mockup Garaje sin "Servicios" (fuera del MVP): Inicio, Garaje y Perfil, más el botón flotante Preguntar. */
export default function LayoutPestanas() {
  return (
    <Tabs screenOptions={{ headerShown: false }} tabBar={(props) => <BarraPestanas {...props} />}>
      <Tabs.Screen name="inicio" options={{ title: 'Inicio' }} />
      <Tabs.Screen name="garaje" options={{ title: 'Garaje' }} />
      <Tabs.Screen name="perfil" options={{ title: 'Perfil' }} />
    </Tabs>
  );
}
