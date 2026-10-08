import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Boton, LogoW, marca, Texto } from '@/shared/design-system';

import { EscenaCarretera } from './EscenaCarretera';

type Props = {
  onAgregarVehiculo: () => void;
};

/**
 * Mockup Portada, sin cuentas (identidad por dispositivo, ADR 0002): un solo botón "Agregar mi vehículo".
 */
export function PantallaPortada({ onAgregarVehiculo }: Props) {
  const margenes = useSafeAreaInsets();
  return (
    <View style={estilos.contenedor}>
      <EscenaCarretera />
      <View style={[estilos.marca, { top: margenes.top + 24 }]}>
        <LogoW tamano={36} />
        <Texto style={estilos.nombre}>weveh</Texto>
      </View>
      <View style={[estilos.copia, { top: margenes.top + 94 }]}>
        <Texto variante="tituloEscena" accessibilityRole="header" style={estilos.titulo}>
          Tu vehículo al día, sin acordarte de nada
        </Texto>
        <Texto style={estilos.bajada}>Te avisamos cuándo toca cada cambio y te ayudamos cuando algo falla.</Texto>
      </View>
      <View style={[estilos.acciones, { bottom: margenes.bottom + 26 }]}>
        <Boton variante="menta" texto="Agregar mi vehículo" onPress={onAgregarVehiculo} />
        <Texto variante="nota" style={estilos.legal}>
          Sin cuentas ni contraseñas: tus datos quedan ligados a este celular.
        </Texto>
      </View>
    </View>
  );
}

const estilos = StyleSheet.create({
  contenedor: { flex: 1, backgroundColor: marca.cielo },
  marca: { position: 'absolute', left: 24, flexDirection: 'row', alignItems: 'center', gap: 8 },
  nombre: { color: '#FFFFFF', fontFamily: 'Manrope_800ExtraBold', fontSize: 24, letterSpacing: -0.5 },
  copia: { position: 'absolute', left: 24, right: 24, gap: 12 },
  titulo: { color: '#FFFFFF', textShadowColor: 'rgba(0,0,0,0.35)', textShadowRadius: 14 },
  bajada: { color: 'rgba(255,255,255,0.86)', maxWidth: 290 },
  acciones: { position: 'absolute', left: 20, right: 20, gap: 10 },
  legal: { color: 'rgba(255,255,255,0.72)', textAlign: 'center', marginHorizontal: 4 },
});
