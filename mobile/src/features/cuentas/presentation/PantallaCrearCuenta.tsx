import { useState } from 'react';
import { View } from 'react-native';

import { Boton, Campo, Casilla, Texto } from '@/shared/design-system';

import { useCrearCuenta, useEntrarConGoogle } from '../application/sesion';
import {
  CREAR_CUENTA_INICIAL,
  datosQueFaltan,
  erroresCrearCuenta,
  LARGO_MINIMO_CONTRASENA,
  textoQueFalta,
  type DatosCrearCuenta,
} from '../domain/formularios';
import { BotonGoogle } from './BotonGoogle';
import { AvisoError, Enlace, Formulario, Separador } from './Formulario';
import { seguirEntrada, type DestinosEntrada } from './seguirEntrada';

type Props = DestinosEntrada &
  Readonly<{
    onVolver: () => void;
    onIniciarSesion: () => void;
    onRevisarCorreo: (correo: string) => void;
    onLeerPolitica: () => void;
  }>;

/**
 * Mockup Portada → Crear cuenta (RF-CTA-01, RF-DAT-01). La casilla de la política nunca viene marcada. Con Google
 * no hay casilla aquí: la política se acepta después, en "Antes de entrar".
 */
export function PantallaCrearCuenta({ onVolver, onIniciarSesion, onRevisarCorreo, onLeerPolitica, ...destinos }: Props) {
  const [datos, setDatos] = useState<DatosCrearCuenta>(CREAR_CUENTA_INICIAL);
  const crear = useCrearCuenta();
  const google = useEntrarConGoogle();
  const faltan = datosQueFaltan(datos);
  const errores = erroresCrearCuenta(datos);
  const error = crear.error ?? google.error;
  const cambiar = (cambio: Partial<DatosCrearCuenta>) => setDatos((actual) => ({ ...actual, ...cambio }));

  return (
    <Formulario titulo="Crea tu cuenta" bajada="Tarda menos de un minuto. Cada dato enciende una luz." onVolver={onVolver}>
      <BotonGoogle ocupado={google.isPending} onPress={() => google.mutate(undefined, { onSuccess: (r) => seguirEntrada(r, destinos) })} />
      <Separador texto="o con tu correo" />
      <Texto variante="fuerte" tono="primarioTinta" accessibilityLiveRegion="polite">
        {textoQueFalta(faltan)}
      </Texto>
      {error && <AvisoError error={error} />}
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
      <Enlace accion="Leer la política" onPress={onLeerPolitica} />
      <View>
        <Boton
          texto={crear.isPending ? 'Creando tu cuenta…' : 'Crear cuenta'}
          deshabilitado={faltan > 0 || crear.isPending}
          onPress={() =>
            crear.mutate(datos, {
              onSuccess: (r) => (r.requiereVerificarCorreo ? onRevisarCorreo(r.correo) : destinos.onSesionIniciada()),
            })
          }
        />
      </View>
      <Enlace pregunta="¿Ya tienes cuenta?" accion="Inicia sesión" onPress={onIniciarSesion} />
    </Formulario>
  );
}
