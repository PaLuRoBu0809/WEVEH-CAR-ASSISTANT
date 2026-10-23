import { router } from 'expo-router';

import { PantallaMisDatos } from '@/features/cuentas';

export default function MisDatos() {
  return (
    <PantallaMisDatos
      onVolver={() => (router.canGoBack() ? router.back() : router.replace('/perfil'))}
      onCambiarNombre={() => router.push('/cuenta/nombre')}
      onCambiarCorreo={() => router.push('/cuenta/correo')}
      onCambiarContrasena={() => router.push('/cuenta/contrasena')}
      onEliminar={() => router.push('/cuenta/eliminar')}
      onLeerPolitica={() => router.push('/politica')}
    />
  );
}
