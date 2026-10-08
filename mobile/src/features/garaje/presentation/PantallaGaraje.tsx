import { ActivityIndicator, View } from 'react-native';

import { mensajeParaPersona } from '@/shared/http';
import { useTema } from '@/shared/design-system';

import { useVehiculos } from '../application/useVehiculos';
import { EstadoError } from './EstadoError';
import { GarajeVacio } from './GarajeVacio';
import { ListaVehiculos } from './ListaVehiculos';

export function PantallaGaraje() {
  const tema = useTema();
  const { data, error, isPending, refetch } = useVehiculos();

  if (isPending) {
    return (
      <View style={{ flex: 1, justifyContent: 'center' }}>
        <ActivityIndicator color={tema.accion} accessibilityLabel="Cargando tu garaje" />
      </View>
    );
  }
  if (error) {
    return <EstadoError mensaje={mensajeParaPersona(error)} onReintentar={() => refetch()} />;
  }
  if (data.length === 0) {
    return <GarajeVacio />;
  }
  return <ListaVehiculos vehiculos={data} />;
}
