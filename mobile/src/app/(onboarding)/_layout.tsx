import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

/** Las escenas de la marca son siempre oscuras, en claro y en oscuro. */
export default function LayoutBienvenida() {
  return (
    <>
      <StatusBar style="light" />
      <Stack screenOptions={{ headerShown: false, animation: 'fade' }} />
    </>
  );
}
