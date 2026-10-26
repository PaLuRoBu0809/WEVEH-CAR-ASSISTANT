import { useRef, useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { nombreParaMostrar, useVehiculos } from '@/features/garaje';
import { Boton, espacio, IconoAtras, IconoEnviar, Opciones, radio, TACTIL_MINIMO, Texto, useTema } from '@/shared/design-system';
import { mensajeParaPersona } from '@/shared/http';
import { useConexion } from '@/shared/sinRed';

import { useConversacion, useConversaciones, useEnviarMensaje } from '../application/useConversacion';
import { EJEMPLOS, type Mensaje } from '../domain/diagnostico';
import { BotonMicrofono } from './BotonMicrofono';
import { TarjetaDiagnostico } from './TarjetaDiagnostico';

type Props = Readonly<{
  onVolver: () => void;
  onAgregarVehiculo: () => void;
}>;

export const AVISO_DATOS_PERSONALES = 'No escribas datos personales: ni tu nombre, ni la placa, ni tu cédula.';
export const SIN_CONEXION = 'Necesitas conexión para hablar con el Mecánico IA.';
const LARGO_MAXIMO = 1000;

/** RF-MIA-02: conversación continua con el Mecánico IA, por texto o por voz (RF-MIA-11). */
export function PantallaPreguntar({ onVolver, onAgregarVehiculo }: Props) {
  const tema = useTema();
  const margenes = useSafeAreaInsets();
  const conectado = useConexion();
  const vehiculos = useVehiculos();
  const [elegido, setElegido] = useState<string | null>(null);
  const [conversacionId, setConversacionId] = useState<string | null>(null);
  const [texto, setTexto] = useState('');
  const [errorVoz, setErrorVoz] = useState<string | null>(null);
  const desplazamiento = useRef<ScrollView>(null);

  const lista = vehiculos.data ?? [];
  const vehiculo = lista.find((v) => v.id === elegido) ?? lista[0];
  const conversacion = useConversacion(vehiculo?.id, conversacionId);
  const anteriores = useConversaciones(vehiculo?.id);
  const envio = useEnviarMensaje(vehiculo?.id);

  const mensajes = conversacionId ? (conversacion.data?.mensajes ?? []) : [];
  const puedeEnviar = Boolean(vehiculo) && conectado && texto.trim().length >= 3 && !envio.isPending;

  const enviar = (contenido = texto) => {
    const limpio = contenido.trim();
    if (!vehiculo || !conectado || limpio.length < 3 || envio.isPending) return;
    setErrorVoz(null);
    envio.mutate(
      { conversacionId, texto: limpio },
      {
        onSuccess: ({ conversacionId: id }) => {
          setConversacionId(id);
          setTexto('');
        },
      },
    );
  };

  const nueva = () => {
    envio.reset();
    setConversacionId(null);
    setTexto('');
    setErrorVoz(null);
  };

  return (
    <KeyboardAvoidingView style={[estilos.raiz, { backgroundColor: tema.fondo }]} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={[estilos.barra, { paddingTop: margenes.top + 4, borderBottomColor: tema.linea }]}>
        <Pressable accessibilityRole="button" accessibilityLabel="Volver" onPress={onVolver} style={estilos.volver}>
          <IconoAtras color={tema.primarioTinta} tamano={20} />
          <Texto variante="fuerte" tono="primarioTinta">
            Atrás
          </Texto>
        </Pressable>
        {conversacionId && (
          <Pressable accessibilityRole="button" onPress={nueva} style={estilos.volver}>
            <Texto variante="fuerte" tono="primarioTinta">
              Nueva conversación
            </Texto>
          </Pressable>
        )}
      </View>

      <ScrollView
        ref={desplazamiento}
        onContentSizeChange={() => desplazamiento.current?.scrollToEnd({ animated: true })}
        contentContainerStyle={estilos.contenido}
        keyboardShouldPersistTaps="handled">
        {vehiculos.isPending && <ActivityIndicator color={tema.primario} />}

        {vehiculos.data && lista.length === 0 && (
          <View style={estilos.contenido}>
            <Texto variante="titulo" accessibilityRole="header">
              Primero agrega tu vehículo
            </Texto>
            <Texto tono="texto2">El Mecánico IA usa la marca, el modelo y el kilometraje para orientarte.</Texto>
            <Boton texto="Agregar mi vehículo" onPress={onAgregarVehiculo} />
          </View>
        )}

        {vehiculo && !conversacionId && (
          <>
            <View>
              <Texto variante="nota" tono="texto3">
                {nombreParaMostrar(vehiculo)} · {vehiculo.marca} {vehiculo.anioModelo}
              </Texto>
              <Texto variante="titulo" accessibilityRole="header">
                ¿Qué le pasa a tu vehículo?
              </Texto>
              <Texto tono="texto2">Escríbeme o mantén pulsado el micrófono y cuéntamelo con tus palabras.</Texto>
            </View>
            {lista.length > 1 && (
              <Opciones
                etiqueta="Vehículo"
                opciones={lista.map((v) => ({ valor: v.id, texto: nombreParaMostrar(v) }))}
                valor={vehiculo.id}
                onCambiar={setElegido}
              />
            )}
            <View style={estilos.ejemplos}>
              {EJEMPLOS.map((ejemplo) => (
                <Pressable
                  key={ejemplo}
                  accessibilityRole="button"
                  onPress={() => setTexto(ejemplo)}
                  style={[estilos.ejemplo, { backgroundColor: tema.superficie }]}>
                  <Texto variante="nota" tono="texto2">
                    {ejemplo}
                  </Texto>
                </Pressable>
              ))}
            </View>
            {(anteriores.data?.length ?? 0) > 0 && (
              <View style={estilos.anteriores}>
                <Texto variante="fuerte">Conversaciones anteriores</Texto>
                {anteriores.data?.slice(0, 5).map((c) => (
                  <Pressable
                    key={c.id}
                    accessibilityRole="button"
                    onPress={() => setConversacionId(c.id)}
                    style={[estilos.anterior, { borderColor: tema.linea }]}>
                    <Texto numberOfLines={1} tono="texto2">
                      {c.primerMensaje ?? 'Conversación'}
                    </Texto>
                  </Pressable>
                ))}
              </View>
            )}
          </>
        )}

        {conversacion.isPending && conversacionId && <ActivityIndicator color={tema.primario} />}
        {mensajes.map((mensaje, indice) => (
          <Burbuja key={`${mensaje.creado}-${indice}`} mensaje={mensaje} />
        ))}

        {envio.isPending && (
          <>
            <Burbuja mensaje={{ rol: 'PERSONA', texto: envio.variables?.texto ?? '', tarjeta: null, creado: '' }} />
            <Texto variante="nota" tono="texto3" accessibilityLiveRegion="polite">
              El Mecánico IA está revisando con los datos de tu vehículo…
            </Texto>
          </>
        )}

        {envio.error && (
          <View style={[estilos.error, { backgroundColor: tema.errorTinte }]} accessibilityRole="alert">
            <Texto variante="fuerte" style={{ color: tema.errorTinta }}>
              {mensajeParaPersona(envio.error)}
            </Texto>
          </View>
        )}
      </ScrollView>

      {vehiculo && (
        <View style={[estilos.entrada, { paddingBottom: margenes.bottom + 8, borderTopColor: tema.linea, backgroundColor: tema.fondo }]}>
          {!conectado && (
            <Texto variante="nota" tono="texto2" accessibilityRole="alert">
              {SIN_CONEXION}
            </Texto>
          )}
          {errorVoz && (
            <Texto variante="nota" style={{ color: tema.errorTinta }} accessibilityRole="alert">
              {errorVoz}
            </Texto>
          )}
          <View style={estilos.fila}>
            <BotonMicrofono
              deshabilitado={!conectado || envio.isPending}
              onTexto={(transcrito) => {
                setErrorVoz(null);
                setTexto((anterior) => (anterior.trim() ? `${anterior.trim()} ${transcrito}` : transcrito).slice(0, LARGO_MAXIMO));
              }}
              onError={setErrorVoz}
            />
            <TextInput
              accessibilityLabel="Mensaje para el Mecánico IA"
              placeholder="Escribe tu mensaje"
              placeholderTextColor={tema.texto3}
              multiline
              maxLength={LARGO_MAXIMO}
              value={texto}
              onChangeText={setTexto}
              style={[estilos.campo, { backgroundColor: tema.superficie, color: tema.texto }]}
            />
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Enviar"
              disabled={!puedeEnviar}
              onPress={() => enviar()}
              style={[estilos.enviar, { backgroundColor: tema.primario, opacity: puedeEnviar ? 1 : 0.4 }]}>
              <IconoEnviar color={tema.sobrePrimario} tamano={20} />
            </Pressable>
          </View>
          <Texto variante="nota" tono="texto3" style={estilos.centro}>
            {AVISO_DATOS_PERSONALES}
          </Texto>
        </View>
      )}
    </KeyboardAvoidingView>
  );
}

function Burbuja({ mensaje }: Readonly<{ mensaje: Mensaje }>) {
  const tema = useTema();
  const propio = mensaje.rol === 'PERSONA';
  return (
    <View style={[estilos.burbujaFila, propio && estilos.derecha]}>
      <View
        style={[
          estilos.burbuja,
          propio ? { backgroundColor: tema.primarioTinte, borderBottomRightRadius: 4 } : { backgroundColor: tema.superficie, borderBottomLeftRadius: 4 },
        ]}>
        {!propio && (
          <Texto variante="nota" tono="texto3">
            Mecánico IA
          </Texto>
        )}
        <Texto tono={propio ? 'primarioTinta' : 'texto'}>{mensaje.texto}</Texto>
      </View>
      {mensaje.tarjeta && (
        <View style={estilos.tarjeta}>
          <TarjetaDiagnostico diagnostico={mensaje.tarjeta} />
        </View>
      )}
    </View>
  );
}

const estilos = StyleSheet.create({
  raiz: { flex: 1 },
  barra: { paddingHorizontal: 14, borderBottomWidth: 1, flexDirection: 'row', justifyContent: 'space-between' },
  volver: { minHeight: TACTIL_MINIMO, flexDirection: 'row', alignItems: 'center', gap: 4 },
  contenido: { paddingHorizontal: espacio.l, paddingVertical: espacio.m, gap: espacio.m },
  ejemplos: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  ejemplo: { borderRadius: radio.total, paddingHorizontal: 12, minHeight: 36, justifyContent: 'center' },
  anteriores: { gap: espacio.s },
  anterior: { borderWidth: 1, borderRadius: radio.m, paddingHorizontal: 12, minHeight: TACTIL_MINIMO, justifyContent: 'center' },
  burbujaFila: { gap: espacio.s, alignItems: 'flex-start' },
  derecha: { alignItems: 'flex-end' },
  burbuja: { maxWidth: '85%', borderRadius: radio.l, paddingHorizontal: 14, paddingVertical: 10, gap: 2 },
  tarjeta: { alignSelf: 'stretch' },
  error: { borderRadius: radio.m, padding: 14 },
  entrada: { borderTopWidth: 1, paddingHorizontal: espacio.m, paddingTop: 8, gap: 6 },
  fila: { flexDirection: 'row', alignItems: 'flex-end', gap: 8 },
  campo: { flex: 1, borderRadius: radio.l, paddingHorizontal: 14, paddingTop: 12, paddingBottom: 12, minHeight: TACTIL_MINIMO + 4, maxHeight: 140, fontSize: 16 },
  enviar: { width: TACTIL_MINIMO + 4, height: TACTIL_MINIMO + 4, borderRadius: radio.total, alignItems: 'center', justifyContent: 'center' },
  centro: { textAlign: 'center' },
});
