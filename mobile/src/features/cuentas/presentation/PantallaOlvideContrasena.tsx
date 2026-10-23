import { useState } from 'react';

import { Boton, Campo, Texto } from '@/shared/design-system';

import { usePedirRecuperacion } from '../application/enlacesCorreo';
import { ESPERA_REENVIO_SEGUNDOS, esCorreoValido, VENCIMIENTO_ENLACE } from '../domain/formularios';
import { AvisoError, Enlace, Formulario, textoReenviar, useEspera } from './Formulario';

type Props = Readonly<{ onVolverAIniciarSesion: () => void }>;

/**
 * Mockup 1 · ¿Olvidaste tu contraseña? (RF-CTA-03). "Enlace enviado" nunca confirma si la cuenta existe: el texto es
 * el mismo para cualquier correo.
 */
export function PantallaOlvideContrasena({ onVolverAIniciarSesion }: Props) {
  const [correo, setCorreo] = useState('');
  const [enviadoA, setEnviadoA] = useState<string>();
  const pedir = usePedirRecuperacion();
  const espera = useEspera(ESPERA_REENVIO_SEGUNDOS);
  const enviar = () =>
    pedir.mutate(correo, {
      onSuccess: (limpio) => {
        setEnviadoA(limpio);
        espera.iniciar();
      },
    });

  if (enviadoA) {
    return (
      <Formulario titulo="Enlace enviado" onVolver={onVolverAIniciarSesion}>
        <Texto tono="texto2">
          Si hay una cuenta con <Texto variante="fuerte">{enviadoA}</Texto>, te llegará un correo con el enlace para crear
          una nueva contraseña. Vence en {VENCIMIENTO_ENLACE}. Si no lo ves, revisa el spam.
        </Texto>
        {pedir.isError && <AvisoError error={pedir.error} />}
        <Boton
          variante="secundario"
          texto={textoReenviar('Reenviar', espera.restante)}
          deshabilitado={espera.restante > 0 || pedir.isPending}
          onPress={enviar}
        />
        <Enlace accion="Volver a iniciar sesión" onPress={onVolverAIniciarSesion} />
      </Formulario>
    );
  }

  return (
    <Formulario
      titulo="¿Olvidaste tu contraseña?"
      bajada="Escribe el correo de tu cuenta y te enviamos un enlace para crear una nueva."
      onVolver={onVolverAIniciarSesion}>
      {pedir.isError && <AvisoError error={pedir.error} />}
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
        texto={pedir.isPending ? 'Enviando…' : 'Enviar enlace'}
        deshabilitado={!esCorreoValido(correo) || pedir.isPending}
        onPress={enviar}
      />
      <Enlace accion="Volver a iniciar sesión" onPress={onVolverAIniciarSesion} />
    </Formulario>
  );
}
