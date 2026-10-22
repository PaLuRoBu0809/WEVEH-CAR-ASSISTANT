import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { Boton, Campo, espacio, Texto, useTema } from '@/shared/design-system';

import { useEliminarCuenta, useSesionReciente } from '../application/gestionCuenta';
import { useUsuarioDeSesion } from '../application/sesion';
import { confirmaEliminar, PALABRA_ELIMINAR } from '../domain/gestionCuenta';
import { ConfirmarIdentidad } from './ConfirmarIdentidad';
import { AvisoError, Formulario } from './Formulario';

type Props = Readonly<{ onVolver: () => void; onEliminada: () => void }>;

const QUE_SE_BORRA = [
  'Tu cuenta, tu nombre y tu correo.',
  'Tus vehículos, su plan, sus documentos, tanqueadas y fotos.',
  'Tus conversaciones con el Mecánico IA.',
] as const;

/**
 * RF-DAT-06 y RF-DAT-07: eliminar la cuenta borra todo en menos de 24 horas y retira la autorización. Pide confirmar
 * la identidad (RF-CTA-05) y escribir ELIMINAR para que no pase por un toque sin querer.
 */
export function PantallaEliminarCuenta({ onVolver, onEliminada }: Props) {
  const tema = useTema();
  const usuario = useUsuarioDeSesion();
  const reciente = useSesionReciente();
  const [palabra, setPalabra] = useState('');
  const eliminar = useEliminarCuenta();

  return (
    <Formulario
      titulo="Eliminar mi cuenta"
      bajada="Esto no se puede deshacer. En menos de 24 horas borramos:"
      onVolver={onVolver}>
      <View style={estilos.lista}>
        {QUE_SE_BORRA.map((punto) => (
          <View key={punto} style={estilos.punto}>
            <View style={[estilos.vineta, { backgroundColor: tema.error }]} />
            <Texto style={estilos.textoPunto}>{punto}</Texto>
          </View>
        ))}
      </View>
      <Texto tono="texto2">Eliminar tu cuenta también retira tu autorización para que WEVEH trate tus datos.</Texto>

      {eliminar.isError && <AvisoError error={eliminar.error} />}
      {reciente ? (
        <>
          <Campo
            etiqueta={`Escribe ${PALABRA_ELIMINAR} para confirmar`}
            autoCapitalize="characters"
            autoCorrect={false}
            value={palabra}
            onChangeText={setPalabra}
          />
          <Boton
            texto={eliminar.isPending ? 'Eliminando…' : 'Eliminar mi cuenta para siempre'}
            deshabilitado={!confirmaEliminar(palabra) || eliminar.isPending}
            onPress={() => eliminar.mutate(undefined, { onSuccess: onEliminada })}
          />
        </>
      ) : (
        <ConfirmarIdentidad conGoogle={usuario?.conGoogle ?? false} siguiente="/cuenta/eliminar" />
      )}
    </Formulario>
  );
}

const estilos = StyleSheet.create({
  lista: { gap: espacio.sm },
  punto: { flexDirection: 'row', gap: espacio.sm, alignItems: 'flex-start' },
  vineta: { width: 8, height: 8, borderRadius: 4, marginTop: 7 },
  textoPunto: { flex: 1 },
});
