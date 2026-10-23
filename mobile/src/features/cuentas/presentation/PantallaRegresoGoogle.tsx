import { useEffect } from 'react';

import { Boton } from '@/shared/design-system';

import { useEntradaDesdeEnlace } from '../application/sesion';
import { AvisoError, Formulario } from './Formulario';
import { seguirEntrada, type DestinosEntrada } from './seguirEntrada';

type Props = DestinosEntrada &
  Readonly<{
    parametros: Readonly<Record<string, string | undefined>>;
    onVolverAIniciarSesion: () => void;
  }>;

/** /auth/callback: Google devuelve aquí a la persona con el código para terminar de entrar (RF-CTA-02). */
export function PantallaRegresoGoogle({ parametros, onVolverAIniciarSesion, onSesionIniciada, onFaltaPolitica }: Props) {
  const entrada = useEntradaDesdeEnlace(parametros);
  const resultado = entrada.data;

  useEffect(() => {
    if (resultado) {
      seguirEntrada(resultado, { onSesionIniciada, onFaltaPolitica });
    }
  }, [resultado, onSesionIniciada, onFaltaPolitica]);

  if (entrada.isError) {
    return (
      <Formulario titulo="No pudimos entrar con Google">
        <AvisoError error={entrada.error} />
        <Boton texto="Volver a iniciar sesión" onPress={onVolverAIniciarSesion} />
      </Formulario>
    );
  }
  return <Formulario titulo="Entrando con Google…">{null}</Formulario>;
}
