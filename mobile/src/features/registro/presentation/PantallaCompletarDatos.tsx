import { useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { listaFaltantes, nombreParaMostrar, useCompletarRegistro, useVehiculo, type VehiculoResumen } from '@/features/garaje';
import { Boton, espacio, IconoAtras, radio, TACTIL_MINIMO, Texto, useTema } from '@/shared/design-system';
import { mensajeParaPersona } from '@/shared/http';

import { aRegistroCompletado, erroresAlCompletar, formularioCompletarDesde } from '../domain/completar';
import type { Formulario } from '../domain/formulario';
import { PasoAceite, PasoPapeles } from './PasosDatos';

type Props = Readonly<{
  vehiculoId: string;
  onVolver: () => void;
  onListo: () => void;
}>;

/** RF-GAR-02b: completar el aceite y los papeles que quedaron para después, con los mismos campos del registro. */
export function PantallaCompletarDatos({ vehiculoId, onVolver, onListo }: Props) {
  const tema = useTema();
  const margenes = useSafeAreaInsets();
  const { data: vehiculo, error, isPending } = useVehiculo(vehiculoId);

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: tema.fondo }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={[estilos.contenido, { paddingTop: margenes.top + espacio.s, paddingBottom: margenes.bottom + espacio.xl }]}>
        <Pressable accessibilityRole="button" accessibilityLabel="Volver" onPress={onVolver} style={estilos.atras}>
          <IconoAtras color={tema.texto} tamano={24} />
        </Pressable>
        {isPending && <ActivityIndicator color={tema.primario} accessibilityLabel="Cargando el vehículo" />}
        {error && <Texto accessibilityRole="alert">{mensajeParaPersona(error)}</Texto>}
        {vehiculo && <CamposCompletar key={vehiculo.versionFila} vehiculo={vehiculo} onListo={onListo} />}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function CamposCompletar({ vehiculo, onListo }: { vehiculo: VehiculoResumen; onListo: () => void }) {
  const tema = useTema();
  const [formulario, setFormulario] = useState<Formulario>(() => formularioCompletarDesde(vehiculo));
  const [mostrarErrores, setMostrarErrores] = useState(false);
  const completar = useCompletarRegistro(vehiculo.id);
  const errores = mostrarErrores ? erroresAlCompletar(formulario) : {};
  const cambiar = (cambios: Partial<Formulario>) => {
    completar.reset();
    setFormulario((actual) => ({ ...actual, ...cambios }));
  };

  const guardar = () => {
    if (Object.keys(erroresAlCompletar(formulario)).length > 0) {
      setMostrarErrores(true);
      return;
    }
    completar.mutate(aRegistroCompletado(formulario, vehiculo.versionFila), { onSuccess: onListo });
  };

  const props = { formulario, errores, cambiar };
  return (
    <>
      <View>
        <Texto variante="nota" tono="texto3">
          {nombreParaMostrar(vehiculo)}
        </Texto>
        <Texto variante="titulo" accessibilityRole="header">
          Completa los datos
        </Texto>
        <Texto tono="texto2">
          {vehiculo.datosFaltantes.length > 0
            ? `Falta ${listaFaltantes(vehiculo.datosFaltantes)}. Llena lo que tengas a mano.`
            : 'Revisa o corrige el aceite y los papeles.'}
        </Texto>
      </View>
      <Texto variante="seccion" tono="texto3">
        Último cambio de aceite
      </Texto>
      <PasoAceite {...props} />
      <Texto variante="seccion" tono="texto3">
        Papeles
      </Texto>
      <PasoPapeles {...props} conMatricula={false} />
      {completar.error && (
        <View style={[estilos.error, { backgroundColor: tema.errorTinte }]} accessibilityRole="alert">
          <Texto variante="fuerte" style={{ color: tema.errorTinta }}>
            {mensajeParaPersona(completar.error)}
          </Texto>
        </View>
      )}
      <Boton texto={completar.isPending ? 'Guardando…' : 'Guardar'} deshabilitado={completar.isPending} onPress={guardar} />
    </>
  );
}

const estilos = StyleSheet.create({
  contenido: { paddingHorizontal: espacio.l, gap: espacio.m },
  atras: { width: TACTIL_MINIMO, height: TACTIL_MINIMO, justifyContent: 'center', marginLeft: -8 },
  error: { borderRadius: radio.m, padding: 14 },
});
