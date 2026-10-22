import { useState } from 'react';

import { Boton, Campo, Texto } from '@/shared/design-system';

import { useCambiarContrasena, useCambiarCorreo, useEditarNombre, useSesionReciente } from '../application/gestionCuenta';
import { useCuenta } from '../application/sesion';
import { LARGO_MINIMO_CONTRASENA, revisarNuevaContrasena, VENCIMIENTO_ENLACE } from '../domain/formularios';
import { errorCorreoNuevo, errorNombre, puedeCambiarCorreo } from '../domain/gestionCuenta';
import { ConfirmarIdentidad } from './ConfirmarIdentidad';
import { AvisoError, Formulario } from './Formulario';

type Props = Readonly<{ onVolver: () => void }>;

/** RF-CTA-07 / RF-DAT-05: corregir el nombre. */
export function PantallaCambiarNombre({ onVolver }: Props) {
  const cuenta = useCuenta();
  const [nombre, setNombre] = useState<string>();
  const editar = useEditarNombre();
  const valor = nombre ?? cuenta.data?.nombre ?? '';
  const error = nombre === undefined ? undefined : errorNombre(valor);

  if (editar.isSuccess) {
    return (
      <Formulario titulo="Listo" bajada={`Ahora te llamamos ${editar.data.nombre}.`} onVolver={onVolver}>
        <Boton texto="Volver a Mis datos" onPress={onVolver} />
      </Formulario>
    );
  }

  return (
    <Formulario titulo="Cambiar nombre" bajada="Así te saludamos en la app y en los correos." onVolver={onVolver}>
      {editar.isError && <AvisoError error={editar.error} />}
      <Campo etiqueta="Nombre" autoComplete="name" textContentType="name" value={valor} error={error} onChangeText={setNombre} />
      <Boton
        texto={editar.isPending ? 'Guardando…' : 'Guardar'}
        deshabilitado={nombre === undefined || errorNombre(valor) !== undefined || editar.isPending}
        onPress={() => editar.mutate(valor)}
      />
    </Formulario>
  );
}

/**
 * RF-CTA-07 y RF-CTA-05: cambiar el correo pide confirmar la identidad y abrir dos enlaces, uno en el correo actual y
 * otro en el nuevo.
 */
export function PantallaCambiarCorreo({ onVolver }: Props) {
  const cuenta = useCuenta();
  const reciente = useSesionReciente();
  const [nuevo, setNuevo] = useState('');
  const cambiar = useCambiarCorreo();
  const actual = cuenta.data?.correo;

  if (cambiar.isSuccess) {
    return (
      <Formulario
        titulo="Revisa tus dos correos"
        bajada={`Te enviamos un enlace a ${actual ?? 'tu correo actual'} y otro a ${cambiar.data}. Ábrelos los dos para terminar. Vencen en ${VENCIMIENTO_ENLACE}.`}
        onVolver={onVolver}>
        <Texto tono="texto2">Mientras tanto, sigues entrando con tu correo actual.</Texto>
        <Boton texto="Volver a Mis datos" onPress={onVolver} />
      </Formulario>
    );
  }

  return (
    <Formulario titulo="Cambiar correo" bajada={`Tu correo actual es ${actual ?? '…'}.`} onVolver={onVolver}>
      {reciente ? (
        <>
          {cambiar.isError && <AvisoError error={cambiar.error} />}
          <Campo
            etiqueta="Correo nuevo"
            placeholder="laura@correo.com"
            autoCapitalize="none"
            autoComplete="email"
            keyboardType="email-address"
            textContentType="emailAddress"
            value={nuevo}
            error={errorCorreoNuevo(nuevo, actual)}
            onChangeText={setNuevo}
          />
          <Boton
            texto={cambiar.isPending ? 'Enviando…' : 'Enviar enlaces'}
            deshabilitado={!puedeCambiarCorreo(nuevo, actual) || cambiar.isPending}
            onPress={() => cambiar.mutate(nuevo)}
          />
        </>
      ) : (
        <ConfirmarIdentidad conGoogle={false} siguiente="/cuenta/correo" />
      )}
    </Formulario>
  );
}

/** Cambiar la contraseña desde Mis datos: la actual confirma la identidad (RF-CTA-05). */
export function PantallaCambiarContrasena({ onVolver }: Props) {
  const [actual, setActual] = useState('');
  const [nueva, setNueva] = useState('');
  const [confirmacion, setConfirmacion] = useState('');
  const cambiar = useCambiarContrasena();
  const revision = revisarNuevaContrasena(nueva, confirmacion);

  if (cambiar.isSuccess) {
    return (
      <Formulario
        titulo="Listo, cambiaste tu contraseña"
        bajada="Usa la nueva la próxima vez. Cerramos tu sesión en los demás equipos."
        onVolver={onVolver}>
        <Boton texto="Volver a Mis datos" onPress={onVolver} />
      </Formulario>
    );
  }

  return (
    <Formulario titulo="Cambiar contraseña" bajada="Elige una que no uses en otros sitios." onVolver={onVolver}>
      {cambiar.isError && <AvisoError error={cambiar.error} />}
      <Campo
        etiqueta="Contraseña actual"
        placeholder="Tu contraseña"
        secureTextEntry
        autoCapitalize="none"
        autoComplete="current-password"
        textContentType="password"
        value={actual}
        onChangeText={setActual}
      />
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
        etiqueta="Confirma la nueva"
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
      <Boton
        texto={cambiar.isPending ? 'Guardando…' : 'Guardar'}
        deshabilitado={!actual || !revision.lista || cambiar.isPending}
        onPress={() => cambiar.mutate({ actual, nueva })}
      />
    </Formulario>
  );
}
