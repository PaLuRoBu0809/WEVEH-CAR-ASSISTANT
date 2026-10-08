import { FlatList, StyleSheet, View } from 'react-native';

import { espacio, radio, Texto, useTema } from '@/shared/design-system';

import { nombreParaMostrar, type VehiculoResumen } from '../domain/vehiculo';

type Props = {
  vehiculos: readonly VehiculoResumen[];
};

const formatoKm = new Intl.NumberFormat('es-CO');

export function ListaVehiculos({ vehiculos }: Props) {
  const tema = useTema();
  return (
    <FlatList
      data={vehiculos}
      keyExtractor={(vehiculo) => vehiculo.id}
      contentContainerStyle={estilos.lista}
      renderItem={({ item }) => (
        <View style={[estilos.tarjeta, { backgroundColor: tema.superficie, borderColor: tema.borde }]}>
          <Texto variante="subtitulo">{nombreParaMostrar(item)}</Texto>
          <Texto suave>
            {item.marca} {item.linea} · {item.anioModelo}
          </Texto>
          <Texto suave>{formatoKm.format(item.kilometraje)} km</Texto>
        </View>
      )}
    />
  );
}

const estilos = StyleSheet.create({
  lista: {
    padding: espacio.m,
    gap: espacio.m,
  },
  tarjeta: {
    padding: espacio.m,
    borderRadius: radio.m,
    borderWidth: 1,
    gap: espacio.xs,
  },
});
