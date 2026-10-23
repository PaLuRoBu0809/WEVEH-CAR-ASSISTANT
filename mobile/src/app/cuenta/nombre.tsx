import { router } from 'expo-router';

import { PantallaCambiarNombre } from '@/features/cuentas';

export default function CambiarNombre() {
  return <PantallaCambiarNombre onVolver={() => (router.canGoBack() ? router.back() : router.replace('/cuenta/mis-datos'))} />;
}
