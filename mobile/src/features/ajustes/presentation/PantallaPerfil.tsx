import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useCerrarSesion, useCuenta } from '@/features/cuentas';
import {
  Boton,
  espacio,
  fuentes,
  IconoPerfil,
  radio,
  TACTIL_MINIMO,
  Tarjeta,
  Texto,
  useEstadoTema,
  useTema,
  type ModoTema,
} from '@/shared/design-system';

const OPCIONES: readonly { modo: ModoTema; texto: string }[] = [
  { modo: 'claro', texto: 'Claro' },
  { modo: 'oscuro', texto: 'Oscuro' },
];

type Props = Readonly<{ onMisDatos: () => void }>;

/** Mockup Garaje → Perfil: la cuenta (ADR 0005), "Mis datos" (RF-DAT-04), cerrar sesión (RF-CTA-06) y el tema. */
export function PantallaPerfil({ onMisDatos }: Props) {
  const tema = useTema();
  const cuenta = useCuenta();
  const cerrarSesion = useCerrarSesion();
  const margenes = useSafeAreaInsets();
  const modo = useEstadoTema(estado => estado.modo);
  const cambiarModo = useEstadoTema(estado => estado.cambiarModo);

  return (
    <ScrollView
      style={{ backgroundColor: tema.fondo }}
      contentContainerStyle={[estilos.contenido, { paddingTop: margenes.top + espacio.s }]}
    >
      <View>
        <Texto variante="nota" tono="texto3">
          Tu cuenta
        </Texto>
        <Texto variante="titulo" accessibilityRole="header">
          Perfil
        </Texto>
      </View>

      <Pressable accessibilityRole="button" accessibilityLabel="Mis datos" onPress={onMisDatos}>
        <Tarjeta>
          <View style={estilos.fila}>
            <View style={[estilos.icono, { backgroundColor: tema.primarioTinte }]}>
              <IconoPerfil color={tema.primarioTinta} tamano={22} />
            </View>
            <View style={estilos.crece}>
              <Texto variante="fuerte">{cuenta.data?.nombre ?? 'Tu cuenta'}</Texto>
              <Texto variante="nota" tono="texto2">
                {cuenta.data?.correo ?? (cuenta.isError ? 'No pudimos cargar tus datos' : 'Cargando…')}
              </Texto>
              <Texto variante="fuerte" tono="primarioTinta">
                Mis datos
              </Texto>
            </View>
          </View>
        </Tarjeta>
      </Pressable>
      <Boton
        variante="secundario"
        texto={cerrarSesion.isPending ? 'Cerrando sesión…' : 'Cerrar sesión'}
        deshabilitado={cerrarSesion.isPending}
        onPress={() => cerrarSesion.mutate()}
      />

      <Texto variante="seccion" tono="texto3" style={estilos.seccion}>
        Apariencia
      </Texto>
      <View style={estilos.chips} accessibilityRole="radiogroup" accessibilityLabel="Apariencia">
        {OPCIONES.map(opcion => {
          const activo = modo === opcion.modo;
          return (
            <Pressable
              key={opcion.modo}
              accessibilityRole="radio"
              accessibilityState={{ checked: activo }}
              onPress={() => cambiarModo(opcion.modo)}
              style={[
                estilos.chip,
                {
                  borderColor: activo ? tema.primario : tema.campo,
                  backgroundColor: activo ? tema.primarioTinte : tema.fondo,
                },
              ]}
            >
              <Texto style={{ fontFamily: fuentes.semi, color: activo ? tema.primarioTinta : tema.texto2 }}>{opcion.texto}</Texto>
            </Pressable>
          );
        })}
      </View>
    </ScrollView>
  );
}

const estilos = StyleSheet.create({
  contenido: { paddingHorizontal: espacio.l, paddingBottom: 96, gap: espacio.sm },
  fila: { flexDirection: 'row', gap: espacio.sm, alignItems: 'flex-start' },
  icono: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  crece: { flex: 1, minWidth: 0, gap: 2 },
  seccion: { marginTop: espacio.l },
  chips: { flexDirection: 'row', gap: espacio.s, flexWrap: 'wrap' },
  chip: {
    minHeight: TACTIL_MINIMO,
    borderRadius: radio.total,
    borderWidth: 1,
    paddingHorizontal: espacio.m,
    justifyContent: 'center',
  },
});
