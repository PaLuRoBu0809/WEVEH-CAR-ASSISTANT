import { router } from 'expo-router';

import { PantallaCrearCuenta } from '@/features/cuentas';

export default function CrearCuenta() {
  return (
    <PantallaCrearCuenta
      onVolver={() => (router.canGoBack() ? router.back() : router.replace('/portada'))}
      onIniciarSesion={() => router.replace('/iniciar-sesion')}
      onRevisarCorreo={(correo) => router.push({ pathname: '/revisa-correo', params: { correo } })}
      onLeerPolitica={() => router.push('/politica')}
      onSesionIniciada={() => router.replace('/garaje')}
      onFaltaPolitica={() => router.replace('/aceptar-politica')}
    />
  );
}
