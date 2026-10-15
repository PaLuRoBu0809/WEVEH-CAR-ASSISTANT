import { router } from 'expo-router';

import { PantallaPortada } from '@/features/bienvenida';

export default function Portada() {
  return (
    <PantallaPortada
      onCrearCuenta={() => router.push('/crear-cuenta')}
      onIniciarSesion={() => router.push('/iniciar-sesion')}
    />
  );
}
