import { Redirect } from 'expo-router';
import { Tabs } from 'expo-router/js-tabs';

import { useEstadoSesion, useFaltaPerfil } from '@/features/cuentas';
import { BarraPestanas } from '@/shared/navegacion';

/** Mockup Garaje sin "Servicios" (fuera del MVP): Inicio, Garaje y Perfil, más el botón flotante Preguntar. */
export default function LayoutPestanas() {
  const sesion = useEstadoSesion();
  const faltaPerfil = useFaltaPerfil();
  if (sesion === 'sin-sesion') {
    return <Redirect href="/portada" />;
  }
  // Entró con Google y cerró la app antes de aceptar la política (RF-DAT-01)
  if (faltaPerfil) {
    return <Redirect href="/aceptar-politica" />;
  }
  return (
    <Tabs screenOptions={{ headerShown: false }} tabBar={(props) => <BarraPestanas {...props} />}>
      <Tabs.Screen name="inicio" options={{ title: 'Inicio' }} />
      <Tabs.Screen name="garaje" options={{ title: 'Garaje' }} />
      <Tabs.Screen name="perfil" options={{ title: 'Perfil' }} />
    </Tabs>
  );
}
