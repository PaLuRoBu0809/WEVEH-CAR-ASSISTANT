import { router, useLocalSearchParams } from 'expo-router';
import { Linking } from 'react-native';

import { ENLACE_APP, PantallaCorreoCambiado } from '@/features/cuentas';

/** Se abre desde los correos del cambio de correo (docs/correos/cambiar-correo.html), con ?token_hash=. */
export default function CorreoCambiado() {
  const { token_hash } = useLocalSearchParams<{ token_hash?: string }>();
  return (
    <PantallaCorreoCambiado
      tokenHash={token_hash}
      onAbrirApp={() => Linking.openURL(ENLACE_APP).catch(() => undefined)}
      onIniciarSesion={() => router.replace('/iniciar-sesion')}
    />
  );
}
