import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { Boton, Casilla, espacio, Texto, useTema } from '@/shared/design-system';

import { useAceptarPolitica, useCerrarSesion, useUsuarioDeSesion } from '../application/sesion';
import { RESUMEN_POLITICA } from '../domain/politica';
import { AvisoError, Enlace, Formulario } from './Formulario';

type Props = Readonly<{
  onLeerPolitica: () => void;
  onAceptada: () => void;
  onSalir: () => void;
}>;

/**
 * Mockup 7 · Antes de entrar (RF-DAT-01): la primera vez que entra con Google. Google verifica el correo, pero la
 * autorización de datos es aparte y la casilla viene sin marcar. Sin aceptarla, la persona puede salir.
 */
export function PantallaAceptarPolitica({ onLeerPolitica, onAceptada, onSalir }: Props) {
  const [acepta, setAcepta] = useState(false);
  const usuario = useUsuarioDeSesion();
  const aceptar = useAceptarPolitica();
  const cerrarSesion = useCerrarSesion();
  const salir = () => cerrarSesion.mutate(undefined, { onSettled: onSalir });

  return (
    <Formulario titulo="Antes de entrar" bajada="Así cuidamos tus datos, en corto." onVolver={salir}>
      {usuario?.correo ? (
        <Texto tono="texto2">
          {usuario.conGoogle ? 'Entraste con Google como ' : 'Entraste como '}
          <Texto variante="fuerte">{usuario.correo}</Texto>
        </Texto>
      ) : null}
      <Resumen />
      <Enlace accion="Leer la política completa" onPress={onLeerPolitica} />
      {aceptar.isError && <AvisoError error={aceptar.error} />}
      <Casilla texto="Acepto la política de tratamiento de datos personales." marcada={acepta} onCambiar={setAcepta} />
      <Boton
        texto={aceptar.isPending ? 'Guardando…' : 'Continuar'}
        deshabilitado={!acepta || aceptar.isPending}
        onPress={() => aceptar.mutate(undefined, { onSuccess: onAceptada })}
      />
      <Enlace pregunta="¿Prefieres no seguir?" accion="Salir" onPress={salir} />
    </Formulario>
  );
}

function Resumen() {
  const tema = useTema();
  return (
    <View style={estilos.resumen}>
      {RESUMEN_POLITICA.map((punto) => (
        <View key={punto} style={estilos.punto}>
          <View style={[estilos.vineta, { backgroundColor: tema.primario }]} />
          <Texto style={estilos.textoPunto}>{punto}</Texto>
        </View>
      ))}
    </View>
  );
}

const estilos = StyleSheet.create({
  resumen: { gap: espacio.sm },
  punto: { flexDirection: 'row', gap: espacio.sm, alignItems: 'flex-start' },
  vineta: { width: 8, height: 8, borderRadius: 4, marginTop: 7 },
  textoPunto: { flex: 1 },
});
