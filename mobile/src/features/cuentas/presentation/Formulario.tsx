import { StatusBar } from 'expo-status-bar';
import type { ReactNode } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { espacio, IconoAtras, radio, TACTIL_MINIMO, Texto, useEstadoTema, useTema } from '@/shared/design-system';
import { ErrorApi, ErrorSinConexion, mensajeParaPersona } from '@/shared/http';

type Props = Readonly<{
  titulo: string;
  bajada: string;
  onVolver: () => void;
  children: ReactNode;
}>;

/** ".sheet" del mockup Portada para crear cuenta e iniciar sesión: título, bajada y el formulario. */
export function Formulario({ titulo, bajada, onVolver, children }: Props) {
  const tema = useTema();
  const modo = useEstadoTema((estado) => estado.modo);
  const margenes = useSafeAreaInsets();
  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: tema.fondo }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <StatusBar style={modo === 'oscuro' ? 'light' : 'dark'} />
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={[estilos.contenido, { paddingTop: margenes.top + espacio.s, paddingBottom: margenes.bottom + espacio.l }]}>
        <Pressable accessibilityRole="button" accessibilityLabel="Volver a la portada" onPress={onVolver} style={estilos.atras}>
          <IconoAtras color={tema.texto} tamano={24} />
        </Pressable>
        <View style={estilos.encabezado}>
          <Texto variante="titulo" accessibilityRole="header">
            {titulo}
          </Texto>
          <Texto tono="texto2">{bajada}</Texto>
        </View>
        {children}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

/** Aviso de error en rojo, anunciado por el lector de pantalla. */
export function AvisoError({ error }: Readonly<{ error: Error }>) {
  const tema = useTema();
  return (
    <View accessibilityRole="alert" style={[estilos.aviso, { backgroundColor: tema.errorTinte }]}>
      <Texto style={{ color: tema.errorTinta }}>{textoDelError(error)}</Texto>
    </View>
  );
}

/** Los errores de la API pasan por el texto común; los de Supabase Auth ya vienen en palabras de la persona. */
function textoDelError(error: Error): string {
  return error instanceof ErrorApi || error instanceof ErrorSinConexion ? mensajeParaPersona(error) : error.message;
}

/** "¿No tienes cuenta? Crear cuenta" al pie del formulario. */
export function Enlace({ pregunta, accion, onPress }: Readonly<{ pregunta: string; accion: string; onPress: () => void }>) {
  return (
    <View style={estilos.pie}>
      <Texto tono="texto2">{pregunta}</Texto>
      <Pressable accessibilityRole="link" onPress={onPress} style={estilos.enlace}>
        <Texto variante="fuerte" tono="primarioTinta">
          {accion}
        </Texto>
      </Pressable>
    </View>
  );
}

const estilos = StyleSheet.create({
  contenido: { paddingHorizontal: espacio.l, gap: espacio.m },
  atras: { width: TACTIL_MINIMO, height: TACTIL_MINIMO, justifyContent: 'center', marginLeft: -8 },
  encabezado: { gap: 6 },
  aviso: { borderRadius: radio.m, padding: espacio.sm },
  pie: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 6, flexWrap: 'wrap' },
  enlace: { minHeight: TACTIL_MINIMO, justifyContent: 'center' },
});
