import { router } from 'expo-router';

import { PantallaPortada } from '@/features/bienvenida';

export default function Portada() {
  return <PantallaPortada onAgregarVehiculo={() => router.push('/registro-vehiculo')} />;
}
