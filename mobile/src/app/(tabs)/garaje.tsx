import { router } from 'expo-router';

import { PantallaGaraje } from '@/features/garaje';

export default function Garaje() {
  return <PantallaGaraje onAgregar={() => router.push('/registro-vehiculo')} />;
}
