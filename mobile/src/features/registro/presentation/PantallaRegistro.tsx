import { useMemo, useRef, useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useRegistrarVehiculo } from '@/features/garaje';
import { Boton, espacio, IconoAtras, radio, Texto, useTema } from '@/shared/design-system';
import { mensajeParaPersona } from '@/shared/http';

import { aSolicitud, erroresDelPaso, FORMULARIO_INICIAL, PASOS, pasoCompleto, type Formulario } from '../domain/formulario';
import { PasoVehiculo } from './PasoVehiculo';
import { PasoAceite, PasoHoy, PasoNombre, PasoPapeles } from './PasosDatos';
import { TramaW } from './TramaW';

type Props = {
  onCancelar: () => void;
  onRegistrado: (vehiculoId: string) => void;
};

/** RF-GAR-02: registro básico por pasos; cada paso completo enciende una W de la trama. */
export function PantallaRegistro({ onCancelar, onRegistrado }: Props) {
  const tema = useTema();
  const margenes = useSafeAreaInsets();
  const desplazamiento = useRef<ScrollView>(null);
  const [formulario, setFormulario] = useState<Formulario>(FORMULARIO_INICIAL);
  const [paso, setPaso] = useState(0);
  const [mostrarErrores, setMostrarErrores] = useState(false);
  const registrar = useRegistrarVehiculo();

  const encendidas = useMemo(() => PASOS.map((_, i) => i < paso || (i === paso && pasoCompleto(i, formulario))), [paso, formulario]);
  const errores = mostrarErrores ? erroresDelPaso(paso, formulario) : {};
  const faltan = PASOS.length - encendidas.filter(Boolean).length;
  const ultimo = paso === PASOS.length - 1;

  const cambiar = (cambios: Partial<Formulario>) => {
    registrar.reset();
    setFormulario((actual) => ({ ...actual, ...cambios }));
  };

  const irA = (nuevo: number) => {
    setMostrarErrores(false);
    setPaso(nuevo);
    desplazamiento.current?.scrollTo({ y: 0, animated: false });
  };

  const siguiente = () => {
    if (!pasoCompleto(paso, formulario)) {
      setMostrarErrores(true);
      return;
    }
    if (!ultimo) {
      irA(paso + 1);
      return;
    }
    registrar.mutate(aSolicitud(formulario), { onSuccess: (vehiculo) => onRegistrado(vehiculo.id) });
  };

  const props = { formulario, errores, cambiar };

  return (
    <KeyboardAvoidingView style={[estilos.raiz, { backgroundColor: tema.fondo }]} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View>
        <TramaW encendidas={encendidas} />
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={paso === 0 ? 'Cancelar el registro' : 'Volver al paso anterior'}
          onPress={() => (paso === 0 ? onCancelar() : irA(paso - 1))}
          style={[estilos.atras, { top: margenes.top + 12 }]}>
          <IconoAtras color="#FFFFFF" tamano={22} />
        </Pressable>
      </View>
      <ScrollView
        ref={desplazamiento}
        style={[estilos.hoja, { backgroundColor: tema.fondo }]}
        contentContainerStyle={[estilos.contenido, { paddingBottom: margenes.bottom + 28 }]}
        keyboardShouldPersistTaps="handled">
        <View>
          <Texto variante="nota" tono="texto3">
            Paso {paso + 1} de {PASOS.length}
          </Texto>
          <Texto variante="titulo" accessibilityRole="header">
            {PASOS[paso].titulo}
          </Texto>
          <Texto tono="texto2">{PASOS[paso].bajada}</Texto>
        </View>
        <View style={estilos.estado} accessibilityLiveRegion="polite">
          <View style={[estilos.punto, faltan === 0 ? estilos.puntoListo : { backgroundColor: tema.campo }]} />
          <Texto variante="fuerte" style={{ color: faltan === 0 ? tema.okTinta : tema.texto2, fontSize: 14 }}>
            {faltan === 0 ? 'Todo listo: las 5 luces están encendidas' : `Faltan ${faltan} ${faltan === 1 ? 'paso' : 'pasos'}`}
          </Texto>
        </View>

        {paso === 0 && <PasoVehiculo {...props} />}
        {paso === 1 && <PasoHoy {...props} />}
        {paso === 2 && <PasoAceite {...props} />}
        {paso === 3 && <PasoPapeles {...props} />}
        {paso === 4 && <PasoNombre {...props} />}

        {registrar.error && (
          <View style={[estilos.error, { backgroundColor: tema.errorTinte }]} accessibilityRole="alert">
            <Texto variante="fuerte" style={{ color: tema.errorTinta }}>
              {mensajeParaPersona(registrar.error)}
            </Texto>
          </View>
        )}
        <Boton
          texto={ultimo ? (registrar.isPending ? 'Guardando…' : 'Agregar al garaje') : 'Siguiente'}
          onPress={siguiente}
          deshabilitado={registrar.isPending}
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const estilos = StyleSheet.create({
  raiz: { flex: 1 },
  atras: {
    position: 'absolute',
    left: 12,
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  hoja: { flex: 1, marginTop: -26, borderTopLeftRadius: radio.hoja, borderTopRightRadius: radio.hoja },
  contenido: { paddingHorizontal: espacio.l, paddingTop: espacio.xl, gap: espacio.m },
  estado: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  punto: { width: 10, height: 10, borderRadius: 5 },
  puntoListo: { backgroundColor: '#FFB000', shadowColor: '#FFB000', shadowOpacity: 0.6, shadowRadius: 4 },
  error: { borderRadius: radio.m, padding: 14 },
});
