import { router, useLocalSearchParams } from 'expo-router';
import { Linking } from 'react-native';

import { ENLACE_APP, PantallaCuentaConfirmada } from '@/features/cuentas';

/** Se abre desde el correo de confirmación (docs/correos/confirmar.html), con ?token_hash=. */
export default function CuentaConfirmada() {
  const { token_hash } = useLocalSearchParams<{ token_hash?: string }>();
  return (
    <PantallaCuentaConfirmada
      tokenHash={token_hash}
      onAbrirApp={() => Linking.openURL(ENLACE_APP).catch(() => undefined)}
      onIniciarSesion={() => router.replace('/iniciar-sesion')}
    />
  );
}
