import { useState } from 'react';

import { Boton, Campo } from '@/shared/design-system';

import { useReenviarVerificacion, useVerificarEnlace } from '../application/enlacesCorreo';
import { ESPERA_REENVIO_SEGUNDOS, esCorreoValido, VENCIMIENTO_ENLACE } from '../domain/formularios';
import { AvisoError, AvisoExito, Enlace, Formulario, textoReenviar, useEspera } from './Formulario';

type Props = Readonly<{
  tokenHash?: string;
  onAbrirApp: () => void;
  onIniciarSesion: () => void;
}>;

/**
 * Mockup 5 · Cuenta confirmada (RF-CTA-04): la página a la que lleva el correo de confirmación, a veces abierta en
 * un computador. Si el enlace venció, pide el correo para enviar otro.
 */
export function PantallaCuentaConfirmada({ tokenHash, onAbrirApp, onIniciarSesion }: Props) {
  const verificacion = useVerificarEnlace('email', tokenHash);

  if (verificacion.isPending) {
    return <Formulario titulo="Confirmando tu correo…">{null}</Formulario>;
  }

  if (verificacion.isError) {
    return <EnlaceVencido onIniciarSesion={onIniciarSesion} />;
  }

  return (
    <Formulario titulo="Cuenta confirmada" bajada="Listo, tu correo quedó verificado. Ya puedes usar WEVEH.">
      <Boton texto="Abrir WEVEH" onPress={onAbrirApp} />
      <Boton variante="secundario" texto="Iniciar sesión" onPress={onIniciarSesion} />
    </Formulario>
  );
}

function EnlaceVencido({ onIniciarSesion }: Readonly<{ onIniciarSesion: () => void }>) {
  const [correo, setCorreo] = useState('');
  const reenviar = useReenviarVerificacion();
  const espera = useEspera(ESPERA_REENVIO_SEGUNDOS);

  return (
    <Formulario
      titulo="Este enlace venció"
      bajada={`El enlace de verificación dura ${VENCIMIENTO_ENLACE} y solo sirve una vez. Escribe tu correo y te enviamos otro.`}>
      {reenviar.isError && <AvisoError error={reenviar.error} />}
      {reenviar.isSuccess && <AvisoExito texto="Si la cuenta está por confirmar, te enviamos un nuevo correo de verificación." />}
      <Campo
        etiqueta="Correo"
        placeholder="laura@correo.com"
        autoCapitalize="none"
        autoComplete="email"
        keyboardType="email-address"
        textContentType="emailAddress"
        value={correo}
        onChangeText={setCorreo}
      />
      <Boton
        texto={textoReenviar('Reenviar verificación', espera.restante)}
        deshabilitado={!esCorreoValido(correo) || espera.restante > 0 || reenviar.isPending}
        onPress={() => reenviar.mutate(correo, { onSuccess: espera.iniciar })}
      />
      <Enlace pregunta="¿Ya la confirmaste?" accion="Inicia sesión" onPress={onIniciarSesion} />
    </Formulario>
  );
}
