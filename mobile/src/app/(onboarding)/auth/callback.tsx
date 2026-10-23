import { router, useLocalSearchParams, type Href } from 'expo-router';

import { destinoSeguro, PantallaRegresoGoogle } from '@/features/cuentas';

const irAAceptarPolitica = () => router.replace('/aceptar-politica');

/**
 * Google devuelve aquí a la persona (?code= o ?error_code=), en la demo web y en el celular. Con ?siguiente= viene de
 * confirmar la identidad (RF-CTA-05) y vuelve a esa pantalla de la cuenta.
 */
export default function RegresoGoogle() {
  const parametros = useLocalSearchParams<{ code?: string; error?: string; error_code?: string; siguiente?: string }>();
  const destino = destinoSeguro(parametros.siguiente);
  return (
    <PantallaRegresoGoogle
      parametros={parametros}
      onVolverAIniciarSesion={() => router.replace('/iniciar-sesion')}
      onSesionIniciada={() => router.replace((destino ?? '/garaje') as Href)}
      onFaltaPolitica={irAAceptarPolitica}
    />
  );
}
