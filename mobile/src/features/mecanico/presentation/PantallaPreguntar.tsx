import { useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { nombreParaMostrar, useVehiculos } from '@/features/garaje';
import { Boton, Campo, espacio, IconoAtras, Opciones, radio, TACTIL_MINIMO, Texto, useTema } from '@/shared/design-system';
import { mensajeParaPersona } from '@/shared/http';

import { useConsultarMecanico } from '../application/useConsultarMecanico';
import { EJEMPLOS } from '../domain/diagnostico';
import { TarjetaDiagnostico } from './TarjetaDiagnostico';

type Props = {
  onVolver: () => void;
  onAgregarVehiculo: () => void;
};

/** RF-MIA-01: Mecánico IA por texto (sin cámara ni voz en el MVP). */
export function PantallaPreguntar({ onVolver, onAgregarVehiculo }: Props) {
  const tema = useTema();
  const margenes = useSafeAreaInsets();
  const vehiculos = useVehiculos();
  const consulta = useConsultarMecanico();
  const [elegido, setElegido] = useState<string | null>(null);
  const [sintoma, setSintoma] = useState('');

  const lista = vehiculos.data ?? [];
  const vehiculo = lista.find((v) => v.id === elegido) ?? lista[0];
  const puedePreguntar = Boolean(vehiculo) && sintoma.trim().length >= 3 && !consulta.isPending;

  const preguntar = () => {
    if (!vehiculo || !puedePreguntar) return;
    consulta.mutate({ vehiculoId: vehiculo.id, sintoma: sintoma.trim() });
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
      </View>
      <ScrollView contentContainerStyle={[estilos.contenido, { paddingBottom: margenes.bottom + 28 }]} keyboardShouldPersistTaps="handled">
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

        {vehiculo && consulta.data && (
          <>
            <TarjetaDiagnostico diagnostico={consulta.data} />
            <Boton
              variante="secundario"
              texto="Preguntar otra cosa"
              onPress={() => {
                consulta.reset();
                setSintoma('');
              }}
            />
          </>
        )}

        {vehiculo && !consulta.data && (
          <>
            <View>
              <Texto variante="nota" tono="texto3">
                {nombreParaMostrar(vehiculo)} · {vehiculo.marca} {vehiculo.anioModelo}
              </Texto>
              <Texto variante="titulo" accessibilityRole="header">
                ¿Qué le pasa a tu vehículo?
              </Texto>
            </View>
            {lista.length > 1 && (
              <Opciones
                etiqueta="Vehículo"
                opciones={lista.map((v) => ({ valor: v.id, texto: nombreParaMostrar(v) }))}
                valor={vehiculo.id}
                onCambiar={setElegido}
              />
            )}
            <Campo
              etiqueta="Cuéntalo con tus palabras"
              placeholder='Ej: "suena un chillido cuando freno"'
              multiline
              numberOfLines={4}
              maxLength={1000}
              value={sintoma}
              onChangeText={(texto) => {
                consulta.reset();
                setSintoma(texto);
              }}
              textAlignVertical="top"
              estiloEntrada={{ minHeight: 110, paddingTop: 12 }}
            />
            <View style={estilos.ejemplos}>
              {EJEMPLOS.map((ejemplo) => (
                <Pressable
                  key={ejemplo}
                  accessibilityRole="button"
                  onPress={() => setSintoma(ejemplo)}
                  style={[estilos.ejemplo, { backgroundColor: tema.superficie }]}>
                  <Texto variante="nota" tono="texto2">
                    {ejemplo}
                  </Texto>
                </Pressable>
              ))}
            </View>
            {consulta.error && (
              <View style={[estilos.error, { backgroundColor: tema.errorTinte }]} accessibilityRole="alert">
                <Texto variante="fuerte" style={{ color: tema.errorTinta }}>
                  {mensajeParaPersona(consulta.error)}
                </Texto>
              </View>
            )}
            <Boton texto={consulta.isPending ? 'Analizando…' : 'Preguntar'} onPress={preguntar} deshabilitado={!puedePreguntar} />
            {consulta.isPending && (
              <Texto variante="nota" tono="texto3" style={estilos.centro}>
                Estamos revisando el síntoma con los datos de tu vehículo. Puede tardar unos segundos.
              </Texto>
            )}
            <Texto variante="nota" tono="texto3" style={estilos.centro}>
              Orientación, no reemplaza al mecánico.
            </Texto>
          </>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const estilos = StyleSheet.create({
  raiz: { flex: 1 },
  barra: { paddingHorizontal: 14, borderBottomWidth: 1 },
  volver: { minHeight: TACTIL_MINIMO, flexDirection: 'row', alignItems: 'center', gap: 4, alignSelf: 'flex-start' },
  contenido: { paddingHorizontal: espacio.l, paddingTop: espacio.m, gap: espacio.m },
  ejemplos: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  ejemplo: { borderRadius: radio.total, paddingHorizontal: 12, minHeight: 36, justifyContent: 'center' },
  error: { borderRadius: radio.m, padding: 14 },
  centro: { textAlign: 'center' },
});
