import { StatusBar } from 'expo-status-bar';
import { useEffect, useState, type ReactNode } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { espacio, IconoAtras, radio, TACTIL_MINIMO, Texto, useEstadoTema, useTema } from '@/shared/design-system';
import { ErrorApi, ErrorSinConexion, mensajeParaPersona } from '@/shared/http';

type Props = Readonly<{
  titulo: string;
  bajada?: string;
  /** Sin flecha en las páginas que se abren desde el correo: no hay a dónde volver. */
  onVolver?: () => void;
  children: ReactNode;
}>;

/** ".sheet" del mockup Portada para las pantallas de cuenta: título, bajada y el formulario. */
export function Formulario({ titulo, bajada, onVolver, children }: Props) {
  const tema = useTema();
  const modo = useEstadoTema((estado) => estado.modo);
  const margenes = useSafeAreaInsets();
  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: tema.fondo }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <StatusBar style={modo === 'oscuro' ? 'light' : 'dark'} />
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={[
          estilos.contenido,
          { paddingTop: margenes.top + (onVolver ? espacio.s : espacio.l), paddingBottom: margenes.bottom + espacio.l },
        ]}>
        {onVolver && (
          <Pressable accessibilityRole="button" accessibilityLabel="Volver" onPress={onVolver} style={estilos.atras}>
            <IconoAtras color={tema.texto} tamano={24} />
          </Pressable>
        )}
        <View style={estilos.encabezado}>
          <Texto variante="titulo" accessibilityRole="header">
            {titulo}
          </Texto>
          {bajada && <Texto tono="texto2">{bajada}</Texto>}
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

/** Aviso de que algo salió bien (enlace enviado, contraseña guardada), en el tinte de la marca. */
export function AvisoExito({ texto }: Readonly<{ texto: string }>) {
  const tema = useTema();
  return (
    <View accessibilityLiveRegion="polite" style={[estilos.aviso, { backgroundColor: tema.primarioTinte }]}>
      <Texto tono="primarioTinta">{texto}</Texto>
    </View>
  );
}

/** Los errores de la API pasan por el texto común; los de Supabase Auth ya vienen en palabras de la persona. */
function textoDelError(error: Error): string {
  return error instanceof ErrorApi || error instanceof ErrorSinConexion ? mensajeParaPersona(error) : error.message;
}

/** "¿No tienes cuenta? Crear cuenta" al pie del formulario. Sin pregunta, queda solo el enlace. */
export function Enlace({ pregunta, accion, onPress }: Readonly<{ pregunta?: string; accion: string; onPress: () => void }>) {
  return (
    <View style={estilos.pie}>
      {pregunta && <Texto tono="texto2">{pregunta}</Texto>}
      <Pressable accessibilityRole="link" onPress={onPress} style={estilos.enlace}>
        <Texto variante="fuerte" tono="primarioTinta">
          {accion}
        </Texto>
      </Pressable>
    </View>
  );
}

/** "o con tu correo" entre el botón de Google y el formulario. */
export function Separador({ texto }: Readonly<{ texto: string }>) {
  const tema = useTema();
  return (
    <View style={estilos.separador} accessibilityRole="text">
      <View style={[estilos.linea, { backgroundColor: tema.campo }]} />
      <Texto variante="nota" tono="texto3">
        {texto}
      </Texto>
      <View style={[estilos.linea, { backgroundColor: tema.campo }]} />
    </View>
  );
}

/**
 * Cuenta atrás para "Reenviar": Supabase no deja pedir otro correo antes de tiempo.
 * @param empezarYa cuando el primer correo acaba de salir
 */
export function useEspera(segundos: number, empezarYa = false) {
  const [restante, setRestante] = useState(empezarYa ? segundos : 0);
  useEffect(() => {
    if (restante <= 0) {
      return;
    }
    const reloj = setTimeout(() => setRestante((actual) => actual - 1), 1000);
    return () => clearTimeout(reloj);
  }, [restante]);
  return { restante, iniciar: () => setRestante(segundos) };
}

export function textoReenviar(accion: string, restante: number): string {
  return restante > 0 ? `${accion} en ${restante} s` : accion;
}

const estilos = StyleSheet.create({
  contenido: { paddingHorizontal: espacio.l, gap: espacio.m },
  atras: { width: TACTIL_MINIMO, height: TACTIL_MINIMO, justifyContent: 'center', marginLeft: -8 },
  encabezado: { gap: 6 },
  aviso: { borderRadius: radio.m, padding: espacio.sm },
  pie: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 6, flexWrap: 'wrap' },
  enlace: { minHeight: TACTIL_MINIMO, justifyContent: 'center' },
  separador: { flexDirection: 'row', alignItems: 'center', gap: espacio.sm },
  linea: { flex: 1, height: 1 },
});
