import { StyleSheet, View } from 'react-native';
import Svg, { Circle, Defs, G, Path, RadialGradient, Rect, Stop } from 'react-native-svg';

import { marca, TRAZO_W } from '@/shared/design-system';

const ANCHO = 372;
const ALTO = 200;
/** Columna y fila de la trama que enciende cada paso (como LIT en el mockup Portada → Crear cuenta). */
const LUCES: readonly [number, number][] = [
  [1, 0],
  [4, 0],
  [2, 2],
  [5, 1],
  [3, 1],
];

type Glifo = { x: number; y: number; luz: number | undefined };

const GLIFOS: Glifo[] = (() => {
  const glifos: Glifo[] = [];
  const filas = Math.ceil((ALTO - 30) / 44) + 1;
  for (let fila = 0; fila < filas; fila++) {
    for (let columna = 0; columna < 7; columna++) {
      const x = 26 + columna * 52 + (fila % 2 ? 26 : 0);
      const y = 40 + fila * 44;
      if (x > 360) continue;
      const luz = LUCES.findIndex(([c, f]) => c === columna && f === fila);
      glifos.push({ x, y, luz: luz >= 0 ? luz : undefined });
    }
  }
  return glifos;
})();

type Props = {
  encendidas: readonly boolean[];
};

/** Trama de W de la marca: cada paso completo enciende una W y su punto ámbar. */
export function TramaW({ encendidas }: Props) {
  const total = encendidas.filter(Boolean).length;
  return (
    <View
      style={estilos.banda}
      accessible
      accessibilityRole="progressbar"
      accessibilityLabel={`${total} de ${encendidas.length} pasos completos`}
      accessibilityValue={{ min: 0, max: encendidas.length, now: total }}>
      <Svg width="100%" height="100%" viewBox={`0 0 ${ANCHO} ${ALTO}`} preserveAspectRatio="xMidYMid slice">
        <Defs>
          <RadialGradient id="luz">
            <Stop offset="0" stopColor={marca.sol} stopOpacity={0.85} />
            <Stop offset="0.5" stopColor={marca.sol} stopOpacity={0.25} />
            <Stop offset="1" stopColor={marca.sol} stopOpacity={0} />
          </RadialGradient>
        </Defs>
        <Rect width={ANCHO} height={ALTO} fill="#004A42" />
        {GLIFOS.map(({ x, y, luz }) => {
          const prendida = luz !== undefined && encendidas[luz];
          return (
            <G key={`${x}-${y}`}>
              {prendida && <Circle cx={x} cy={y - 14} r={40} fill="url(#luz)" />}
              <G transform={`translate(${x - 16},${y - 16}) scale(0.5)`}>
                <Path
                  d={TRAZO_W}
                  fill="none"
                  stroke={prendida ? '#FFFFFF' : '#0B6A5E'}
                  strokeWidth={6}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <Circle cx={32} cy={18} r={5} fill={prendida ? marca.sol : '#0B6A5E'} />
              </G>
            </G>
          );
        })}
      </Svg>
    </View>
  );
}

const estilos = StyleSheet.create({
  banda: { height: 200, backgroundColor: '#004A42', overflow: 'hidden' },
});
