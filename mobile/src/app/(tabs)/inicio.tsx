import { router } from 'expo-router';

import { PantallaInicio } from '@/features/inicio';

export default function Inicio() {
  return <PantallaInicio onAgregar={() => router.push('/registro-vehiculo')} />;
}
