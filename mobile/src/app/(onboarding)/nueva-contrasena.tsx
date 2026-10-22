import { router, useLocalSearchParams } from 'expo-router';

import { PantallaNuevaContrasena } from '@/features/cuentas';

/** Se abre desde el correo de recuperación (docs/correos/recuperar.html), con ?token_hash=. */
export default function NuevaContrasena() {
  const { token_hash } = useLocalSearchParams<{ token_hash?: string }>();
  return (
    <PantallaNuevaContrasena
      tokenHash={token_hash}
      onPedirOtroEnlace={() => router.replace('/olvide-contrasena')}
      onIniciarSesion={() => router.replace('/iniciar-sesion')}
    />
  );
}
