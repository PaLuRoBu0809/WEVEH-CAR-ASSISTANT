import { Pressable, StyleSheet, View } from 'react-native';

import { espacio, fuentes, IconoCarro, IconoMoto, radio, Texto, useTema } from '@/shared/design-system';

import { nombreParaMostrar, type VehiculoResumen } from '../domain/vehiculo';

type Props = {
  vehiculos: readonly VehiculoResumen[];
  onAbrir: (vehiculoId: string) => void;
};

const formatoKm = new Intl.NumberFormat('es-CO');

function TarjetaVehiculo({ vehiculo, onAbrir }: { vehiculo: VehiculoResumen; onAbrir: () => void }) {
  const tema = useTema();
  const nombre = nombreParaMostrar(vehiculo);
  const faltanDatos = vehiculo.datosFaltantes.length > 0;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${nombre}, ${formatoKm.format(vehiculo.kilometraje)} kilómetros${faltanDatos ? ', faltan datos' : ''}`}
      accessibilityHint="Abre el vehículo para editarlo o actualizar el kilometraje"
      onPress={onAbrir}
      style={({ pressed }) => [
        estilos.tarjeta,
        { backgroundColor: tema.superficie, borderLeftColor: tema.primario, opacity: pressed ? 0.85 : 1 },
      ]}>
      <View style={estilos.fila}>
        <View style={[estilos.icono, { backgroundColor: tema.primario }]}>
          {vehiculo.tipo === 'MOTO' ? (
            <IconoMoto color={tema.sobrePrimario} tamano={22} />
          ) : (
            <IconoCarro color={tema.sobrePrimario} tamano={22} />
          )}
        </View>
        <View style={estilos.crece}>
          <Texto variante="subtitulo">{nombre}</Texto>
          <Texto variante="nota" tono="texto2">
            {vehiculo.marca} {vehiculo.linea} · {vehiculo.anioModelo}
          </Texto>
        </View>
        {vehiculo.placa && (
          <View style={[estilos.placa, { borderColor: tema.texto }]}>
            <Texto style={{ fontFamily: fuentes.monoNegrita, fontSize: 14, letterSpacing: 0.8 }}>{vehiculo.placa}</Texto>
          </View>
        )}
      </View>
      <View style={estilos.pie}>
        <Texto variante="nota" tono="texto2" style={{ fontFamily: fuentes.mono }}>
          {formatoKm.format(vehiculo.kilometraje)} km
        </Texto>
        {faltanDatos && (
          <View style={[estilos.pildora, { backgroundColor: tema.primarioTinte }]}>
            <Texto variante="nota" tono="primarioTinta">
              Faltan datos
            </Texto>
          </View>
        )}
      </View>
    </Pressable>
  );
}

/** Tarjetas ".vcard" del mockup. La salud y "lo más urgente" llegan en la fase 2. */
export function ListaVehiculos({ vehiculos, onAbrir }: Props) {
  return (
    <View style={estilos.lista}>
      {vehiculos.map((vehiculo) => (
        <TarjetaVehiculo key={vehiculo.id} vehiculo={vehiculo} onAbrir={() => onAbrir(vehiculo.id)} />
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
  placa: { borderWidth: 1.5, borderRadius: 6, paddingHorizontal: 10, paddingVertical: 2 },
  pie: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  pildora: { borderRadius: radio.total, paddingHorizontal: 10, paddingVertical: 2 },
});
