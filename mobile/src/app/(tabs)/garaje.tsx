import { router } from 'expo-router';

import { PantallaGaraje } from '@/features/garaje';

export default function Garaje() {
  return (
    <PantallaGaraje
      onAgregar={() => router.push('/registro-vehiculo')}
      onAbrir={(id) => router.push({ pathname: '/vehiculo/[id]', params: { id } })}
    />
  );
}
