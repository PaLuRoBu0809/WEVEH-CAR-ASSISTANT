import { StyleSheet, View } from 'react-native';

import { espacio, fuentes, IconoCarro, IconoMoto, radio, Texto, useTema } from '@/shared/design-system';

import { nombreParaMostrar, type VehiculoResumen } from '../domain/vehiculo';

type Props = {
  vehiculos: readonly VehiculoResumen[];
};

const formatoKm = new Intl.NumberFormat('es-CO');

/** Tarjetas ".vcard" del mockup. La salud y "lo más urgente" llegan en la fase 2. */
export function ListaVehiculos({ vehiculos }: Props) {
  const tema = useTema();
  return (
    <View style={estilos.lista}>
      {vehiculos.map((vehiculo) => (
        <View
          key={vehiculo.id}
          style={[estilos.tarjeta, { backgroundColor: tema.superficie, borderLeftColor: tema.primario }]}>
          <View style={estilos.fila}>
            <View style={[estilos.icono, { backgroundColor: tema.primario }]}>
              {vehiculo.tipo === 'MOTO' ? (
                <IconoMoto color={tema.sobrePrimario} tamano={22} />
              ) : (
                <IconoCarro color={tema.sobrePrimario} tamano={22} />
              )}
            </View>
            <View style={estilos.crece}>
              <Texto variante="subtitulo">{nombreParaMostrar(vehiculo)}</Texto>
              <Texto variante="nota" tono="texto2">
                {vehiculo.marca} {vehiculo.linea} · {vehiculo.anioModelo}
              </Texto>
            </View>
          </View>
          <Texto variante="nota" tono="texto2" style={{ fontFamily: fuentes.mono }}>
            {formatoKm.format(vehiculo.kilometraje)} km
          </Texto>
        </View>
      ))}
    </View>
  );
}

const estilos = StyleSheet.create({
  lista: { gap: 10 },
  tarjeta: { borderRadius: radio.xl, padding: espacio.m, gap: 10, borderLeftWidth: 6 },
  fila: { flexDirection: 'row', alignItems: 'center', gap: espacio.sm },
  icono: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  crece: { flex: 1, minWidth: 0 },
});
