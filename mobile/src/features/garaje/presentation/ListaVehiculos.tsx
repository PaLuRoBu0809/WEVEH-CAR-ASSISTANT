import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { Boton, espacio, fuentes, IconoCarro, IconoMoto, radio, Texto, useTema } from '@/shared/design-system';
import { mensajeParaPersona } from '@/shared/http';

import { useEliminarVehiculo } from '../application/useVehiculos';
import { nombreParaMostrar, type VehiculoResumen } from '../domain/vehiculo';

type Props = {
  vehiculos: readonly VehiculoResumen[];
};

const formatoKm = new Intl.NumberFormat('es-CO');

function TarjetaVehiculo({ vehiculo }: { vehiculo: VehiculoResumen }) {
  const tema = useTema();
  const [confirmando, setConfirmando] = useState(false);
  const eliminar = useEliminarVehiculo();
  const nombre = nombreParaMostrar(vehiculo);

  return (
    <View style={[estilos.tarjeta, { backgroundColor: tema.superficie, borderLeftColor: tema.primario }]}>
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
      <Texto variante="nota" tono="texto2" style={{ fontFamily: fuentes.mono }}>
        {formatoKm.format(vehiculo.kilometraje)} km
      </Texto>

      {confirmando ? (
        <View style={[estilos.confirmar, { backgroundColor: tema.errorTinte }]}>
          <Texto variante="fuerte" style={{ color: tema.errorTinta }}>
            ¿Eliminar {nombre}? Se borra todo lo que guardaste de él.
          </Texto>
          {eliminar.error && (
            <Texto variante="nota" style={{ color: tema.errorTinta }}>
              {mensajeParaPersona(eliminar.error)}
            </Texto>
          )}
          <View style={estilos.botones}>
            <Boton
              pequeno
              texto={eliminar.isPending ? 'Eliminando…' : 'Sí, eliminar'}
              deshabilitado={eliminar.isPending}
              onPress={() => eliminar.mutate(vehiculo.id)}
            />
            <Boton pequeno variante="secundario" texto="Cancelar" onPress={() => setConfirmando(false)} />
          </View>
        </View>
      ) : (
        <Boton pequeno variante="secundario" texto="Eliminar" ayuda={`Eliminar ${nombre} del garaje`} onPress={() => setConfirmando(true)} />
      )}
    </View>
  );
}

/** Tarjetas ".vcard" del mockup. La salud y "lo más urgente" llegan en la fase 2. */
export function ListaVehiculos({ vehiculos }: Props) {
  return (
    <View style={estilos.lista}>
      {vehiculos.map((vehiculo) => (
        <TarjetaVehiculo key={vehiculo.id} vehiculo={vehiculo} />
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
  confirmar: { borderRadius: radio.l, padding: 12, gap: 10 },
  botones: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
});
