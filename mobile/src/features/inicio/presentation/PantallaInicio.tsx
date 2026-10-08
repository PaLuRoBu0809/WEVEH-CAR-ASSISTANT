import { ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useVehiculos } from '@/features/garaje';
import { Boton, espacio, radio, Texto, useTema } from '@/shared/design-system';

import { BotonTema } from './BotonTema';

type Props = {
  onAgregar?: () => void;
  ahora?: Date;
};

export function saludo(ahora: Date): string {
  const hora = ahora.getHours();
  if (hora < 12) return 'Buenos días';
  if (hora < 19) return 'Buenas tardes';
  return 'Buenas noches';
}

/** Mockup Garaje → Inicio. "Lo más urgente" y "Para hacer" se llenan en la fase 2 con el plan y los papeles. */
export function PantallaInicio({ onAgregar, ahora = new Date() }: Props) {
  const tema = useTema();
  const margenes = useSafeAreaInsets();
  const { data } = useVehiculos();
  const sinVehiculos = !data || data.length === 0;

  return (
    <ScrollView
      style={{ backgroundColor: tema.fondo }}
      contentContainerStyle={[estilos.contenido, { paddingTop: margenes.top + espacio.s }]}>
      <View style={estilos.cabecera}>
        <View>
          <Texto variante="nota" tono="texto3">
            {saludo(ahora)}
          </Texto>
          <Texto variante="titulo" accessibilityRole="header">
            Esta semana
          </Texto>
        </View>
        <BotonTema />
      </View>
      {sinVehiculos ? (
        <View style={[estilos.urgente, { backgroundColor: tema.primarioTinte }]}>
          <Texto variante="seccion" tono="primarioTinta">
            Empecemos
          </Texto>
          <View>
            <Texto variante="subtitulo">Agrega tu primer vehículo</Texto>
            <Texto variante="nota" tono="texto2">
              Con eso te avisamos a tiempo de cambios de aceite, SOAT y revisión técnico-mecánica.
            </Texto>
          </View>
          <Boton
            texto="Agregar mi vehículo"
            onPress={onAgregar}
            deshabilitado={!onAgregar}
            ayuda={onAgregar ? undefined : 'Muy pronto podrás registrar tu vehículo'}
          />
        </View>
      ) : (
        <View style={[estilos.urgente, { backgroundColor: tema.okTinte }]}>
          <Texto variante="fuerte" style={{ color: tema.okTinta }}>
            Todo al día
          </Texto>
          <Texto variante="nota" tono="texto2">
            Cuando registremos el plan de tu vehículo, aquí verás lo más urgente.
          </Texto>
        </View>
      )}
    </ScrollView>
  );
}

const estilos = StyleSheet.create({
  contenido: { paddingHorizontal: espacio.l, paddingBottom: 96, gap: espacio.sm },
  cabecera: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 },
  urgente: { borderRadius: radio.xl, padding: espacio.m, gap: 10 },
});
