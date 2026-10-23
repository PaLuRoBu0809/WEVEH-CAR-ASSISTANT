import { Boton } from '@/shared/design-system';

import { useVerificarEnlace } from '../application/enlacesCorreo';
import { VENCIMIENTO_ENLACE } from '../domain/formularios';
import { Formulario } from './Formulario';

type Props = Readonly<{
  tokenHash?: string;
  onAbrirApp: () => void;
  onIniciarSesion: () => void;
}>;

/**
 * RF-CTA-07: la página a la que llevan los dos correos del cambio de correo. El primer enlace deja el cambio a medias;
 * el segundo lo termina.
 */
export function PantallaCorreoCambiado({ tokenHash, onAbrirApp, onIniciarSesion }: Props) {
  const verificacion = useVerificarEnlace('email_change', tokenHash);

  if (verificacion.isPending) {
    return <Formulario titulo="Revisando el enlace…">{null}</Formulario>;
  }

  if (verificacion.isError) {
    return (
      <Formulario
        titulo="Este enlace venció"
        bajada={`Los enlaces duran ${VENCIMIENTO_ENLACE} y sirven una vez. Pide el cambio otra vez desde Perfil → Mis datos.`}>
        <Boton texto="Iniciar sesión" onPress={onIniciarSesion} />
      </Formulario>
    );
  }

  if (verificacion.data === 'falta-otro-enlace') {
    return (
      <Formulario
        titulo="Falta un paso"
        bajada="Abre también el enlace que te enviamos al otro correo. Cuando lo abras, el cambio queda listo."
      >
        {null}
      </Formulario>
    );
  }

  return (
    <Formulario titulo="Cambiaste tu correo" bajada="Listo. Desde ahora entras con tu correo nuevo.">
      <Boton texto="Abrir WEVEH" onPress={onAbrirApp} />
      <Boton variante="secundario" texto="Iniciar sesión" onPress={onIniciarSesion} />
    </Formulario>
  );
}
