import { useState } from 'react';
import { View } from 'react-native';

import { Boton, Campo, Casilla, Texto } from '@/shared/design-system';

import { useCrearCuenta } from '../application/sesion';
import {
  CREAR_CUENTA_INICIAL,
  datosQueFaltan,
  erroresCrearCuenta,
  LARGO_MINIMO_CONTRASENA,
  textoQueFalta,
  type DatosCrearCuenta,
} from '../domain/formularios';
import { AvisoError, Enlace, Formulario } from './Formulario';

type Props = Readonly<{
  onVolver: () => void;
  onIniciarSesion: () => void;
  onCuentaLista: () => void;
}>;

/** Mockup Portada → Crear cuenta (RF-CTA-01, RF-DAT-01). La casilla de la política nunca viene marcada. */
export function PantallaCrearCuenta({ onVolver, onIniciarSesion, onCuentaLista }: Props) {
  const [datos, setDatos] = useState<DatosCrearCuenta>(CREAR_CUENTA_INICIAL);
  const crear = useCrearCuenta();
  const faltan = datosQueFaltan(datos);
  const errores = erroresCrearCuenta(datos);
  const cambiar = (cambio: Partial<DatosCrearCuenta>) => setDatos((actual) => ({ ...actual, ...cambio }));

  if (crear.data?.requiereVerificarCorreo) {
    return (
      <Formulario titulo="Revisa tu correo" bajada={`Te enviamos un enlace a ${crear.data.correo}.`} onVolver={onVolver}>
        <Texto tono="texto2">Ábrelo para confirmar tu cuenta y luego inicia sesión. Si no lo ves, busca en correo no deseado.</Texto>
        <Boton texto="Ir a iniciar sesión" onPress={onIniciarSesion} />
      </Formulario>
    );
  }

  return (
    <Formulario titulo="Crea tu cuenta" bajada="Tarda menos de un minuto. Cada dato enciende una luz." onVolver={onVolver}>
      <Texto variante="fuerte" tono="primarioTinta" accessibilityLiveRegion="polite">
        {textoQueFalta(faltan)}
      </Texto>
      {crear.isError && <AvisoError error={crear.error} />}
      <Campo
        etiqueta="Nombre"
        placeholder="Laura"
        autoComplete="name"
        textContentType="name"
        value={datos.nombre}
        onChangeText={(nombre) => cambiar({ nombre })}
      />
      <Campo
        etiqueta="Correo"
        placeholder="laura@correo.com"
        autoCapitalize="none"
        autoComplete="email"
        keyboardType="email-address"
        textContentType="emailAddress"
        value={datos.correo}
        error={errores.correo}
        onChangeText={(correo) => cambiar({ correo })}
      />
      <Campo
        etiqueta="Contraseña"
        placeholder={`Mínimo ${LARGO_MINIMO_CONTRASENA} caracteres`}
        secureTextEntry
        autoCapitalize="none"
        autoComplete="new-password"
        textContentType="newPassword"
        ayuda={`Usa ${LARGO_MINIMO_CONTRASENA} caracteres o más.`}
        value={datos.contrasena}
        error={errores.contrasena}
        onChangeText={(contrasena) => cambiar({ contrasena })}
      />
      <Casilla
        texto="Acepto la política de tratamiento de datos personales. Sin esto no puedo crear la cuenta."
        marcada={datos.aceptaPolitica}
        onCambiar={(aceptaPolitica) => cambiar({ aceptaPolitica })}
      />
      <View>
        <Boton
          texto={crear.isPending ? 'Creando tu cuenta…' : 'Crear cuenta'}
          deshabilitado={faltan > 0 || crear.isPending}
          onPress={() => crear.mutate(datos, { onSuccess: (r) => !r.requiereVerificarCorreo && onCuentaLista() })}
        />
      </View>
      <Enlace pregunta="¿Ya tienes cuenta?" accion="Inicia sesión" onPress={onIniciarSesion} />
    </Formulario>
  );
}
