import { Boton, Texto } from '@/shared/design-system';

import { useReenviarVerificacion } from '../application/enlacesCorreo';
import { ESPERA_REENVIO_SEGUNDOS, VENCIMIENTO_ENLACE } from '../domain/formularios';
import { AvisoError, AvisoExito, Enlace, Formulario, textoReenviar, useEspera } from './Formulario';

type Props = Readonly<{
  correo: string;
  onUsarOtroCorreo: () => void;
  onIniciarSesion: () => void;
}>;

/**
 * Mockup 6 · Revisa tu correo (RF-CTA-04), después de crear la cuenta con correo. Muestra la dirección para que la
 * persona note si la escribió mal. Con Google no pasa por aquí.
 */
export function PantallaRevisaCorreo({ correo, onUsarOtroCorreo, onIniciarSesion }: Props) {
  const reenviar = useReenviarVerificacion();
  const espera = useEspera(ESPERA_REENVIO_SEGUNDOS, true);

  return (
    <Formulario titulo="Revisa tu correo" onVolver={onUsarOtroCorreo}>
      <Texto tono="texto2">
        Te enviamos un correo a <Texto variante="fuerte">{correo}</Texto>. Abre el enlace para confirmar tu cuenta; vence
        en {VENCIMIENTO_ENLACE}. Si no lo ves, revisa el spam.
      </Texto>
      {reenviar.isError && <AvisoError error={reenviar.error} />}
      {reenviar.isSuccess && <AvisoExito texto="Te enviamos el correo otra vez." />}
      <Boton
        variante="secundario"
        texto={textoReenviar('Reenviar', espera.restante)}
        deshabilitado={espera.restante > 0 || reenviar.isPending}
        onPress={() => reenviar.mutate(correo, { onSuccess: espera.iniciar })}
      />
      <Enlace accion="Usar otro correo" onPress={onUsarOtroCorreo} />
      <Enlace pregunta="¿Ya lo confirmaste?" accion="Inicia sesión" onPress={onIniciarSesion} />
    </Formulario>
  );
}
