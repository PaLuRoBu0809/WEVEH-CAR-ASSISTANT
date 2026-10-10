import { Pressable, StyleSheet } from 'react-native';

import { IconoLuna, IconoSol, TACTIL_MINIMO, useEstadoTema, useTema } from '@/shared/design-system';

/** Botón de luna del mockup: alterna entre claro y oscuro. */
export function BotonTema() {
  const tema = useTema();
  const modo = useEstadoTema((estado) => estado.modo);
  const cambiarModo = useEstadoTema((estado) => estado.cambiarModo);
  const oscuro = modo === 'oscuro';
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={oscuro ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
      onPress={() => cambiarModo(oscuro ? 'claro' : 'oscuro')}
      style={[estilos.boton, { borderColor: tema.campo, backgroundColor: tema.fondo }]}>
      {oscuro ? <IconoSol color={tema.texto2} tamano={22} /> : <IconoLuna color={tema.texto2} tamano={22} />}
    </Pressable>
  );
}

const estilos = StyleSheet.create({
  boton: {
    width: TACTIL_MINIMO,
    height: TACTIL_MINIMO,
    borderRadius: TACTIL_MINIMO / 2,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
