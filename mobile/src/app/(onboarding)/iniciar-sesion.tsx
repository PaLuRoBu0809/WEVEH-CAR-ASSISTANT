import { router } from 'expo-router';

import { PantallaIniciarSesion } from '@/features/cuentas';

export default function IniciarSesion() {
  return (
    <PantallaIniciarSesion
      onVolver={() => (router.canGoBack() ? router.back() : router.replace('/portada'))}
      onCrearCuenta={() => router.replace('/crear-cuenta')}
      onOlvideContrasena={() => router.push('/olvide-contrasena')}
      onSesionIniciada={() => router.replace('/garaje')}
      onFaltaPolitica={() => router.replace('/aceptar-politica')}
    />
  );
}
