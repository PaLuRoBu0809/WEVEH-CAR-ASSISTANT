import { useState } from 'react';

import { Boton, Campo, Texto } from '@/shared/design-system';

import { useGuardarNuevaContrasena, useVerificarEnlace } from '../application/enlacesCorreo';
import { useCerrarSesion } from '../application/sesion';
import { LARGO_MINIMO_CONTRASENA, revisarNuevaContrasena, VENCIMIENTO_ENLACE } from '../domain/formularios';
import { AvisoError, Enlace, Formulario } from './Formulario';

type Props = Readonly<{
  tokenHash?: string;
  onPedirOtroEnlace: () => void;
  onIniciarSesion: () => void;
}>;

/**
 * Mockup 3 · Nueva contraseña (RF-CTA-03), en la página a la que lleva el correo. Al guardar se cierran las demás
 * sesiones; al salir se cierra también esta, para entrar con la contraseña nueva.
 */
export function PantallaNuevaContrasena({ tokenHash, onPedirOtroEnlace, onIniciarSesion }: Props) {
  const [nueva, setNueva] = useState('');
  const [confirmacion, setConfirmacion] = useState('');
  const verificacion = useVerificarEnlace('recovery', tokenHash);
  const guardar = useGuardarNuevaContrasena();
  const cerrarSesion = useCerrarSesion();
  const revision = revisarNuevaContrasena(nueva, confirmacion);
  const irAIniciarSesion = () => cerrarSesion.mutate(undefined, { onSettled: onIniciarSesion });

  if (verificacion.isPending) {
    return <Formulario titulo="Revisando el enlace…">{null}</Formulario>;
  }

  if (verificacion.isError) {
    return (
      <Formulario
        titulo="Este enlace venció"
        bajada={`Por seguridad, el enlace dura ${VENCIMIENTO_ENLACE} y solo sirve una vez. Pide otro y te lo enviamos al correo.`}>
        <Boton texto="Pedir otro enlace" onPress={onPedirOtroEnlace} />
        <Enlace accion="Volver a iniciar sesión" onPress={onIniciarSesion} />
      </Formulario>
    );
  }

  if (guardar.isSuccess) {
    return (
      <Formulario
        titulo="Listo, ya puedes entrar"
        bajada="Cambiaste tu contraseña. Usa la nueva la próxima vez que inicies sesión.">
        <Boton texto="Iniciar sesión" deshabilitado={cerrarSesion.isPending} onPress={irAIniciarSesion} />
      </Formulario>
    );
  }

  return (
    <Formulario titulo="Crea tu nueva contraseña" bajada="Elige una que no uses en otros sitios.">
      {guardar.isError && <AvisoError error={guardar.error} />}
      <Campo
        etiqueta="Nueva contraseña"
        placeholder={`Mínimo ${LARGO_MINIMO_CONTRASENA} caracteres`}
        secureTextEntry
        autoCapitalize="none"
        autoComplete="new-password"
        textContentType="newPassword"
        ayuda={revision.ayudaNueva}
        value={nueva}
        onChangeText={setNueva}
      />
      <Campo
        etiqueta="Confirma tu contraseña"
        placeholder="Repítela"
        secureTextEntry
        autoCapitalize="none"
        autoComplete="new-password"
        textContentType="newPassword"
        ayuda={revision.ayudaConfirmacion}
        error={revision.errorConfirmacion}
        value={confirmacion}
        onChangeText={setConfirmacion}
      />
      <Texto variante="fuerte" tono="primarioTinta" accessibilityLiveRegion="polite">
        {revision.lista ? 'Lista para guardar' : 'Escríbela dos veces igual'}
      </Texto>
      <Boton
        texto={guardar.isPending ? 'Guardando…' : 'Guardar'}
        deshabilitado={!revision.lista || guardar.isPending}
        onPress={() => guardar.mutate(nueva)}
      />
    </Formulario>
  );
}
