import { Redirect, router, useLocalSearchParams } from 'expo-router';

import { useEstadoSesion } from '@/features/cuentas';
import { PantallaCompletarDatos } from '@/features/registro';

export default function CompletarDatos() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const sesion = useEstadoSesion();
  if (sesion === 'sin-sesion') {
    return <Redirect href="/portada" />;
  }
  const volver = () => (router.canGoBack() ? router.back() : router.replace('/garaje'));
  return <PantallaCompletarDatos vehiculoId={id} onVolver={volver} onListo={volver} />;
}
