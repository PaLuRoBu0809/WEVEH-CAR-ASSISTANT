import { router } from 'expo-router';
import { useEffect } from 'react';

import { EscenaEncendido, useDestinoInicial } from '@/features/bienvenida';

export default function Encendido() {
  const destino = useDestinoInicial();

  useEffect(() => {
    if (destino) {
      router.replace(destino);
    }
  }, [destino]);

  return <EscenaEncendido />;
}
