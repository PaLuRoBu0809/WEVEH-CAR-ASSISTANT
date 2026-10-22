import { StyleSheet, View } from 'react-native';

import { Boton, espacio, Tarjeta, Texto } from '@/shared/design-system';

import { useCuenta, useUsuarioDeSesion } from '../application/sesion';
import { DATOS_QUE_GUARDAMOS, DATOS_QUE_NO_GUARDAMOS, fechaLegible, textoMedio } from '../domain/gestionCuenta';
import { AvisoError, Enlace, Formulario } from './Formulario';

type Props = Readonly<{
  onVolver: () => void;
  onCambiarNombre: () => void;
  onCambiarCorreo: () => void;
  onCambiarContrasena: () => void;
  onEliminar: () => void;
  onLeerPolitica: () => void;
}>;

/**
 * RF-DAT-04: qué datos personales tiene WEVEH de la persona y para qué, con sus autorizaciones; desde aquí los
 * corrige (RF-DAT-05) o elimina la cuenta (RF-DAT-06). Con Google, el correo y la contraseña los administra Google.
 */
export function PantallaMisDatos(props: Props) {
  const cuenta = useCuenta();
  const usuario = useUsuarioDeSesion();
  const conGoogle = usuario?.conGoogle ?? false;

  return (
    <Formulario titulo="Mis datos" bajada="Lo que WEVEH sabe de ti y para qué lo usa." onVolver={props.onVolver}>
      {cuenta.isError && <AvisoError error={cuenta.error} />}

      <Tarjeta>
        <View style={estilos.bloque}>
          <Dato etiqueta="Nombre" valor={cuenta.data?.nombre ?? 'Cargando…'} />
          <Dato etiqueta="Correo" valor={cuenta.data?.correo ?? 'Cargando…'} />
          {conGoogle && (
            <Texto variante="nota" tono="texto2">
              Entras con Google: tu correo y tu contraseña los administra Google.
            </Texto>
          )}
        </View>
      </Tarjeta>
      <Boton variante="secundario" texto="Cambiar nombre" onPress={props.onCambiarNombre} />
      {!conGoogle && (
        <>
          <Boton variante="secundario" texto="Cambiar correo" onPress={props.onCambiarCorreo} />
          <Boton variante="secundario" texto="Cambiar contraseña" onPress={props.onCambiarContrasena} />
        </>
      )}

      <Texto variante="seccion" tono="texto3" style={estilos.seccion}>
        Para qué usamos tus datos
      </Texto>
      {DATOS_QUE_GUARDAMOS.map(({ dato, para }) => (
        <View key={dato} style={estilos.uso}>
          <Texto variante="fuerte">{dato}</Texto>
          <Texto tono="texto2">{para}</Texto>
        </View>
      ))}
      <Texto tono="texto2">{DATOS_QUE_NO_GUARDAMOS}</Texto>

      <Texto variante="seccion" tono="texto3" style={estilos.seccion}>
        Tu autorización
      </Texto>
      {cuenta.data?.consentimientos.map((consentimiento) => (
        <Texto key={`${consentimiento.versionPolitica}-${consentimiento.aceptadoEn}`} tono="texto2">
          {`Aceptaste la política ${consentimiento.versionPolitica} el ${fechaLegible(consentimiento.aceptadoEn)}, ${textoMedio(consentimiento.medio)}.`}
        </Texto>
      ))}
      <Enlace accion="Leer la política completa" onPress={props.onLeerPolitica} />

      <Texto variante="seccion" tono="texto3" style={estilos.seccion}>
        Eliminar mi cuenta
      </Texto>
      <Texto tono="texto2">
        Borra tu cuenta y todos tus datos. También es la forma de retirar tu autorización.
      </Texto>
      <Boton variante="secundario" texto="Eliminar mi cuenta" onPress={props.onEliminar} />
    </Formulario>
  );
}

function Dato({ etiqueta, valor }: Readonly<{ etiqueta: string; valor: string }>) {
  return (
    <View>
      <Texto variante="nota" tono="texto3">
        {etiqueta}
      </Texto>
      <Texto variante="fuerte">{valor}</Texto>
    </View>
  );
}

const estilos = StyleSheet.create({
  bloque: { gap: espacio.sm },
  seccion: { marginTop: espacio.m },
  uso: { gap: 2 },
});
