import { useState } from 'react';
import { View } from 'react-native';

import { Boton, Campo, espacio, Texto } from '@/shared/design-system';

import { useConfirmarIdentidad } from '../application/gestionCuenta';
import { useEntrarConGoogle } from '../application/sesion';
import { BotonGoogle } from './BotonGoogle';
import { AvisoError } from './Formulario';

type Props = Readonly<{
  conGoogle: boolean;
  /** Pantalla a la que vuelve la web después de pasar por Google. */
  siguiente: string;
}>;

/**
 * RF-CTA-05: antes de una acción delicada, la persona demuestra que es ella. Con contraseña, la escribe otra vez; con
 * Google, vuelve a entrar con Google. Las dos abren una sesión nueva.
 */
export function ConfirmarIdentidad({ conGoogle, siguiente }: Props) {
  const [contrasena, setContrasena] = useState('');
  const confirmar = useConfirmarIdentidad();
  const google = useEntrarConGoogle();
  const error = confirmar.error ?? google.error;

  return (
    <View style={{ gap: espacio.m }}>
      <Texto variante="fuerte">Primero confirma que eres tú</Texto>
      {error && <AvisoError error={error} />}
      {conGoogle ? (
        <BotonGoogle ocupado={google.isPending} onPress={() => google.mutate(siguiente)} />
      ) : (
        <>
          <Campo
            etiqueta="Tu contraseña actual"
            placeholder="Tu contraseña"
            secureTextEntry
            autoCapitalize="none"
            autoComplete="current-password"
            textContentType="password"
            value={contrasena}
            onChangeText={setContrasena}
          />
          <Boton
            texto={confirmar.isPending ? 'Confirmando…' : 'Confirmar que soy yo'}
            deshabilitado={!contrasena || confirmar.isPending}
            onPress={() => confirmar.mutate(contrasena)}
          />
        </>
      )}
    </View>
  );
}
