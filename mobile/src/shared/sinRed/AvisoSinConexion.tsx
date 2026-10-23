import { onlineManager } from '@tanstack/react-query';
import { useEffect, useState, useSyncExternalStore } from 'react';
import { StyleSheet, View } from 'react-native';

import { espacio, radio, Texto, useTema } from '@/shared/design-system';

import { haceCuanto } from './tiempo';

/** true mientras hay red, según NetInfo (persistencia.ts). */
export function useConexion(): boolean {
  return useSyncExternalStore(
    (avisar) => onlineManager.subscribe(avisar),
    () => onlineManager.isOnline(),
  );
}

type Props = Readonly<{
  /** dataUpdatedAt de la consulta que se está mostrando; 0 si nunca llegó. */
  actualizadoEn: number;
}>;

const UN_MINUTO_MS = 60_000;

/** La hora, actualizada cada minuto: "hace X" avanza solo mientras la pantalla está abierta. */
function useAhora(): number {
  const [ahora, setAhora] = useState(Date.now);
  useEffect(() => {
    const reloj = setInterval(() => setAhora(Date.now()), UN_MINUTO_MS);
    return () => clearInterval(reloj);
  }, []);
  return ahora;
}

/** RNF-04: sin red se ve lo último guardado y desde cuándo. Con red no muestra nada. */
export function AvisoSinConexion({ actualizadoEn }: Props) {
  const tema = useTema();
  const conectado = useConexion();
  const ahora = useAhora();
  if (conectado) {
    return null;
  }
  const texto = actualizadoEn > 0 ? `Sin conexión · actualizado ${haceCuanto(actualizadoEn, ahora)}` : 'Sin conexión';
  return (
    <View accessibilityRole="alert" style={[estilos.aviso, { backgroundColor: tema.alertaTinte }]}>
      <Texto variante="fuerte" style={{ color: tema.alertaTinta }}>
        {texto}
      </Texto>
    </View>
  );
}

const estilos = StyleSheet.create({
  aviso: { borderRadius: radio.m, paddingHorizontal: espacio.sm, paddingVertical: espacio.s },
});
