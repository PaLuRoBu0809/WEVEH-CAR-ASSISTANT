import { router } from 'expo-router';

import { PantallaAceptarPolitica } from '@/features/cuentas';

export default function AceptarPolitica() {
  return (
    <PantallaAceptarPolitica
      onLeerPolitica={() => router.push('/politica')}
      onAceptada={() => router.replace('/garaje')}
      onSalir={() => router.replace('/portada')}
    />
  );
}
