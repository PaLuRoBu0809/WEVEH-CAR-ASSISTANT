import { router, useLocalSearchParams } from 'expo-router';

import { PantallaRegresoGoogle } from '@/features/cuentas';

const irAlGaraje = () => router.replace('/garaje');
const irAAceptarPolitica = () => router.replace('/aceptar-politica');

/** Google devuelve aquí a la persona (?code= o ?error_code=), en la demo web y en el celular. */
export default function RegresoGoogle() {
  const parametros = useLocalSearchParams<{ code?: string; error?: string; error_code?: string }>();
  return (
    <PantallaRegresoGoogle
      parametros={parametros}
      onVolverAIniciarSesion={() => router.replace('/iniciar-sesion')}
      onSesionIniciada={irAlGaraje}
      onFaltaPolitica={irAAceptarPolitica}
    />
  );
}
