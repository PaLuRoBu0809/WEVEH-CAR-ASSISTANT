import { Redirect, router, useLocalSearchParams } from 'expo-router';

import { useEstadoSesion } from '@/features/cuentas';
import { PantallaVehiculo } from '@/features/garaje';

export default function Vehiculo() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const sesion = useEstadoSesion();
  if (sesion === 'sin-sesion') {
    return <Redirect href="/portada" />;
  }
  return (
    <PantallaVehiculo
      vehiculoId={id}
      onVolver={() => (router.canGoBack() ? router.back() : router.replace('/garaje'))}
      onCompletarDatos={(vehiculoId) => router.push({ pathname: '/completar-datos/[id]', params: { id: vehiculoId } })}
      onEliminado={() => router.replace('/garaje')}
    />
  );
}
