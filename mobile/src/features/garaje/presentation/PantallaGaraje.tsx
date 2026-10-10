import { ActivityIndicator, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Boton, espacio, Texto, useTema } from '@/shared/design-system';
import { mensajeParaPersona } from '@/shared/http';

import { useVehiculos } from '../application/useVehiculos';
import { EstadoError } from './EstadoError';
import { GarajeVacio } from './GarajeVacio';
import { ListaVehiculos } from './ListaVehiculos';

type Props = {
  onAgregar?: () => void;
};

export function PantallaGaraje({ onAgregar }: Props) {
  const tema = useTema();
  const margenes = useSafeAreaInsets();
  const { data, error, isPending, refetch } = useVehiculos();
  const cantidad = data?.length ?? 0;

  return (
    <ScrollView
      style={{ backgroundColor: tema.fondo }}
      contentContainerStyle={[estilos.contenido, { paddingTop: margenes.top + espacio.s }]}>
      <View>
        <Texto variante="nota" tono="texto3">
          {cantidad === 1 ? '1 vehículo' : `${cantidad} vehículos`}
        </Texto>
        <Texto variante="titulo" accessibilityRole="header" style={estilos.titulo}>
          Mi garaje
        </Texto>
      </View>
      {isPending && <ActivityIndicator color={tema.primario} accessibilityLabel="Cargando tu garaje" />}
      {error && <EstadoError mensaje={mensajeParaPersona(error)} onReintentar={() => refetch()} />}
      {data && data.length === 0 && <GarajeVacio onAgregar={onAgregar} />}
      {data && data.length > 0 && (
        <>
          <ListaVehiculos vehiculos={data} />
          {onAgregar && <Boton variante="secundario" texto="+ Agregar vehículo" onPress={onAgregar} />}
        </>
      )}
    </ScrollView>
  );
}

const estilos = StyleSheet.create({
  contenido: { paddingHorizontal: espacio.l, paddingBottom: 96, gap: espacio.sm },
  titulo: { marginTop: 2, marginBottom: 2 },
});
