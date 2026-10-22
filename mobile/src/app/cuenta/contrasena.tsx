import { router } from 'expo-router';

import { PantallaCambiarContrasena } from '@/features/cuentas';

export default function CambiarContrasena() {
  return (
    <PantallaCambiarContrasena onVolver={() => (router.canGoBack() ? router.back() : router.replace('/cuenta/mis-datos'))} />
  );
}
