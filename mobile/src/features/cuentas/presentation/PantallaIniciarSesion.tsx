import { useState } from 'react';

import { Boton, Campo, Texto } from '@/shared/design-system';

import { useEntrarConGoogle, useIniciarSesion } from '../application/sesion';
import { puedeIniciarSesion } from '../domain/formularios';
import { BotonGoogle } from './BotonGoogle';
import { AvisoError, Enlace, Formulario, Separador } from './Formulario';
import { seguirEntrada, type DestinosEntrada } from './seguirEntrada';

type Props = DestinosEntrada &
  Readonly<{
    onVolver: () => void;
    onCrearCuenta: () => void;
    onOlvideContrasena: () => void;
  }>;

/** Mockup Portada → Iniciar sesión (RF-CTA-02). El error nunca dice si falló el correo o la contraseña. */
export function PantallaIniciarSesion({ onVolver, onCrearCuenta, onOlvideContrasena, ...destinos }: Props) {
  const [correo, setCorreo] = useState('');
  const [contrasena, setContrasena] = useState('');
  const entrar = useIniciarSesion();
  const google = useEntrarConGoogle();
  const listo = puedeIniciarSesion(correo, contrasena);
  const error = entrar.error ?? google.error;

  return (
    <Formulario titulo="Inicia sesión" bajada="Qué bueno verte de nuevo." onVolver={onVolver}>
      <BotonGoogle ocupado={google.isPending} onPress={() => google.mutate(undefined, { onSuccess: (r) => seguirEntrada(r, destinos) })} />
      <Separador texto="o con tu correo" />
      <Texto variante="fuerte" tono="primarioTinta" accessibilityLiveRegion="polite">
        {listo ? 'Listo para entrar' : 'Completa correo y contraseña'}
      </Texto>
      {error && <AvisoError error={error} />}
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
      <Enlace accion="¿Olvidaste tu contraseña?" onPress={onOlvideContrasena} />
      <Boton
        texto={entrar.isPending ? 'Entrando…' : 'Entrar'}
        deshabilitado={!listo || entrar.isPending}
        onPress={() => entrar.mutate({ correo, contrasena }, { onSuccess: (r) => seguirEntrada(r, destinos) })}
      />
      <Enlace pregunta="¿No tienes cuenta?" accion="Crear cuenta" onPress={onCrearCuenta} />
    </Formulario>
  );
}
