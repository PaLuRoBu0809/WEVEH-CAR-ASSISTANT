import { router } from 'expo-router';

import { PantallaIniciarSesion } from '@/features/cuentas';

export default function IniciarSesion() {
  return (
    <PantallaIniciarSesion
      onVolver={() => (router.canGoBack() ? router.back() : router.replace('/portada'))}
      onCrearCuenta={() => router.replace('/crear-cuenta')}
      onSesionIniciada={() => router.replace('/garaje')}
    />
  );
}
