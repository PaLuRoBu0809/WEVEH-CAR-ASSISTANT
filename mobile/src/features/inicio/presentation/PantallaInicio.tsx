import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useVehiculos } from '@/features/garaje';
import { Boton, espacio, radio, TACTIL_MINIMO, Texto, useTema } from '@/shared/design-system';

import { avisosDeInicio, PASOS_REVISAR_ACEITE, type AvisoFaltante } from '../domain/avisos';
import { BotonTema } from './BotonTema';

type Props = {
  onAgregar?: () => void;
  onCompletarDatos: (vehiculoId: string) => void;
  ahora?: Date;
};

export function saludo(ahora: Date): string {
  const hora = ahora.getHours();
  if (hora < 12) return 'Buenos días';
  if (hora < 19) return 'Buenas tardes';
  return 'Buenas noches';
}

/**
 * Mockup Garaje → Inicio. Hoy muestra lo que falta completar (RF-GAR-02b); "Lo más urgente" y "Para hacer" se llenan
 * en la fase 2 con el plan y los papeles.
 */
export function PantallaInicio({ onAgregar, onCompletarDatos, ahora = new Date() }: Props) {
  const tema = useTema();
  const margenes = useSafeAreaInsets();
  const { data } = useVehiculos();
  const sinVehiculos = !data || data.length === 0;
  const avisos = data ? avisosDeInicio(data) : [];

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
      ) : avisos.length > 0 ? (
        avisos.map((aviso) => (
          <TarjetaAviso key={aviso.vehiculoId} aviso={aviso} onCompletar={() => onCompletarDatos(aviso.vehiculoId)} />
        ))
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

/** RF-GAR-02b: lo que falta de un vehículo y, si es el aceite, cómo revisarlo hoy. */
function TarjetaAviso({ aviso, onCompletar }: { aviso: AvisoFaltante; onCompletar: () => void }) {
  const tema = useTema();
  const [guiaAbierta, setGuiaAbierta] = useState(false);
  return (
    <View style={[estilos.urgente, { backgroundColor: tema.primarioTinte }]}>
      <Texto variante="seccion" tono="primarioTinta">
        Para completar
      </Texto>
      <View>
        <Texto variante="subtitulo">{aviso.titulo}</Texto>
        <Texto variante="nota" tono="texto2">
          {aviso.detalle}
        </Texto>
      </View>
      <Boton texto="Completar" onPress={onCompletar} />
      {aviso.guiaAceite && (
        <>
          <Pressable
            accessibilityRole="button"
            accessibilityState={{ expanded: guiaAbierta }}
            onPress={() => setGuiaAbierta((abierta) => !abierta)}
            style={estilos.enlace}>
            <Texto variante="fuerte" tono="primarioTinta">
              {guiaAbierta ? 'Ocultar cómo revisar el aceite' : '¿Cómo reviso el aceite?'}
            </Texto>
          </Pressable>
          {guiaAbierta && (
            <View style={estilos.guia}>
              <Texto variante="nota" tono="texto2">
                Como no sabemos cuándo fue el último cambio, conviene revisarlo ya:
              </Texto>
              {PASOS_REVISAR_ACEITE.map((paso, indice) => (
                <Texto key={paso} variante="nota">
                  {indice + 1}. {paso}
                </Texto>
              ))}
              <Boton variante="secundario" texto="Ya lo cambié" ayuda="Anota cuándo fue el cambio" onPress={onCompletar} />
            </View>
          )}
        </>
      )}
    </View>
  );
}

const estilos = StyleSheet.create({
  contenido: { paddingHorizontal: espacio.l, paddingBottom: 96, gap: espacio.sm },
  cabecera: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 },
  urgente: { borderRadius: radio.xl, padding: espacio.m, gap: 10 },
  enlace: { minHeight: TACTIL_MINIMO, justifyContent: 'center' },
  guia: { gap: 8 },
});
