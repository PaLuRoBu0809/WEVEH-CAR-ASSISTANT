import { router } from 'expo-router';

import { PantallaCrearCuenta } from '@/features/cuentas';

export default function CrearCuenta() {
  return (
    <PantallaCrearCuenta
      onVolver={() => (router.canGoBack() ? router.back() : router.replace('/portada'))}
      onIniciarSesion={() => router.replace('/iniciar-sesion')}
      onCuentaLista={() => router.replace('/garaje')}
    />
  );
}
