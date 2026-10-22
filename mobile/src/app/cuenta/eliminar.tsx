import { router } from 'expo-router';

import { PantallaEliminarCuenta } from '@/features/cuentas';

export default function EliminarCuenta() {
  return (
    <PantallaEliminarCuenta
      onVolver={() => (router.canGoBack() ? router.back() : router.replace('/cuenta/mis-datos'))}
      onEliminada={() => router.replace('/portada')}
    />
  );
}
