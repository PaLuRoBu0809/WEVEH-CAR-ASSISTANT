import { useState } from 'react';

import { Boton, Campo, Texto } from '@/shared/design-system';

import { useIniciarSesion } from '../application/sesion';
import { puedeIniciarSesion } from '../domain/formularios';
import { AvisoError, Enlace, Formulario } from './Formulario';

type Props = Readonly<{
  onVolver: () => void;
  onCrearCuenta: () => void;
  onSesionIniciada: () => void;
}>;

/** Mockup Portada → Iniciar sesión (RF-CTA-02). El error nunca dice si falló el correo o la contraseña. */
export function PantallaIniciarSesion({ onVolver, onCrearCuenta, onSesionIniciada }: Props) {
  const [correo, setCorreo] = useState('');
  const [contrasena, setContrasena] = useState('');
  const entrar = useIniciarSesion();
  const listo = puedeIniciarSesion(correo, contrasena);

  return (
    <Formulario titulo="Inicia sesión" bajada="Qué bueno verte de nuevo." onVolver={onVolver}>
      <Texto variante="fuerte" tono="primarioTinta" accessibilityLiveRegion="polite">
        {listo ? 'Listo para entrar' : 'Completa correo y contraseña'}
      </Texto>
      {entrar.isError && <AvisoError error={entrar.error} />}
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
      <Campo
        etiqueta="Contraseña"
        placeholder="Tu contraseña"
        secureTextEntry
        autoCapitalize="none"
        autoComplete="current-password"
        textContentType="password"
        value={contrasena}
        onChangeText={setContrasena}
      />
      <Boton
        texto={entrar.isPending ? 'Entrando…' : 'Entrar'}
        deshabilitado={!listo || entrar.isPending}
        onPress={() => entrar.mutate({ correo, contrasena }, { onSuccess: onSesionIniciada })}
      />
      <Enlace pregunta="¿No tienes cuenta?" accion="Crear cuenta" onPress={onCrearCuenta} />
    </Formulario>
  );
}
