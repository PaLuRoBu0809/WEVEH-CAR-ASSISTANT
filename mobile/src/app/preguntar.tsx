import { Redirect, router } from 'expo-router';

import { useEstadoSesion } from '@/features/cuentas';
import { PantallaPreguntar } from '@/features/mecanico';

export default function Preguntar() {
  const sesion = useEstadoSesion();
  if (sesion === 'sin-sesion') {
    return <Redirect href="/portada" />;
  }
  return (
    <PantallaPreguntar
      onVolver={() => (router.canGoBack() ? router.back() : router.replace('/inicio'))}
      onAgregarVehiculo={() => router.replace('/registro-vehiculo')}
    />
  );
}
