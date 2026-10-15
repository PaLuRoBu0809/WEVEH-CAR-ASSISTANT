import { Redirect, router } from 'expo-router';

import { useEstadoSesion } from '@/features/cuentas';
import { PantallaRegistro } from '@/features/registro';

export default function RegistroVehiculo() {
  const sesion = useEstadoSesion();
  if (sesion === 'sin-sesion') {
    return <Redirect href="/portada" />;
  }
  return (
    <PantallaRegistro
      onCancelar={() => (router.canGoBack() ? router.back() : router.replace('/garaje'))}
      onRegistrado={() => router.replace('/garaje')}
    />
  );
}
