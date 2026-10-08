import { router } from 'expo-router';

import { PantallaRegistro } from '@/features/registro';

export default function RegistroVehiculo() {
  return (
    <PantallaRegistro
      onCancelar={() => (router.canGoBack() ? router.back() : router.replace('/portada'))}
      onRegistrado={() => router.replace('/garaje')}
    />
  );
}
