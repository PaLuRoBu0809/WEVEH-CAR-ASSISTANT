import { router } from 'expo-router';

import { PantallaPreguntar } from '@/features/mecanico';

export default function Preguntar() {
  return (
    <PantallaPreguntar
      onVolver={() => (router.canGoBack() ? router.back() : router.replace('/inicio'))}
      onAgregarVehiculo={() => router.replace('/registro-vehiculo')}
    />
  );
}
