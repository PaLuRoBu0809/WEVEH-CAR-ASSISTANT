import { router } from 'expo-router';

import { PantallaPerfil } from '@/features/ajustes';

export default function Perfil() {
  return <PantallaPerfil onMisDatos={() => router.push('/cuenta/mis-datos')} />;
}
