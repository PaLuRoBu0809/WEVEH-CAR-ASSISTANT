import { router, useLocalSearchParams } from 'expo-router';

import { PantallaRevisaCorreo } from '@/features/cuentas';

export default function RevisaCorreo() {
  const { correo } = useLocalSearchParams<{ correo?: string }>();
  return (
    <PantallaRevisaCorreo
      correo={correo ?? ''}
      onUsarOtroCorreo={() => (router.canGoBack() ? router.back() : router.replace('/crear-cuenta'))}
      onIniciarSesion={() => router.replace('/iniciar-sesion')}
    />
  );
}
