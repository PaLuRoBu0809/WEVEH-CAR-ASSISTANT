import { router } from 'expo-router';

import { PantallaPortada } from '@/features/bienvenida';

/** El registro por pasos llega en la fase 1 (RF-GAR-02); mientras tanto la portada lleva al garaje. */
export default function Portada() {
  return <PantallaPortada onAgregarVehiculo={() => router.replace('/garaje')} />;
}
