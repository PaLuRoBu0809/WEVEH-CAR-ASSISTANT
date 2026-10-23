import { router } from 'expo-router';

import { PantallaOlvideContrasena } from '@/features/cuentas';

export default function OlvideContrasena() {
  return (
    <PantallaOlvideContrasena
      onVolverAIniciarSesion={() => (router.canGoBack() ? router.back() : router.replace('/iniciar-sesion'))}
    />
  );
}
