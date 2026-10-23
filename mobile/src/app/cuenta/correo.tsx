import { router } from 'expo-router';

import { PantallaCambiarCorreo } from '@/features/cuentas';

export default function CambiarCorreo() {
  return <PantallaCambiarCorreo onVolver={() => (router.canGoBack() ? router.back() : router.replace('/cuenta/mis-datos'))} />;
}
