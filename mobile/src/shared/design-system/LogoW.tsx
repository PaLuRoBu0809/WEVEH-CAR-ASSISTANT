import Svg, { Circle, Path } from 'react-native-svg';

import { marca } from './tokens';

/** Trazo de la W de la marca (viewBox 64) y su punto ámbar. */
export const TRAZO_W = 'M17.5 27 L24.75 46 L32 33 L39.25 46 L46.5 27';

type Props = { tamano?: number; colorW?: string };

export function LogoW({ tamano = 36, colorW = '#FFFFFF' }: Props) {
  return (
    <Svg width={tamano} height={tamano} viewBox="0 0 64 64" fill="none" accessibilityElementsHidden>
      <Path d={TRAZO_W} stroke={colorW} strokeWidth={6} strokeLinecap="round" strokeLinejoin="round" />
      <Circle cx={32} cy={18} r={5} fill={marca.sol} />
    </Svg>
  );
}
