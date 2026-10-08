import type { ReactNode } from 'react';
import Svg, { Circle, Path, Rect } from 'react-native-svg';

/** Íconos de trazo de los mockups (viewBox 24). */
type Props = { color: string; tamano?: number };

function Trazo({ color, tamano = 24, children }: Props & { children: ReactNode }) {
  return (
    <Svg
      width={tamano}
      height={tamano}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants">
      {children}
    </Svg>
  );
}

export const IconoInicio = (p: Props) => (
  <Trazo {...p}>
    <Path d="M3 10l9-6 9 6v10H3z" />
    <Path d="M9 20v-6h6v6" />
  </Trazo>
);

export const IconoCarro = (p: Props) => (
  <Trazo {...p}>
    <Path d="M4 17v-4l2-5h12l2 5v4" />
    <Path d="M4 13h16" />
    <Circle cx={7.5} cy={17} r={1.8} />
    <Circle cx={16.5} cy={17} r={1.8} />
  </Trazo>
);

export const IconoMoto = (p: Props) => (
  <Trazo {...p}>
    <Circle cx={5.5} cy={16.5} r={3.5} />
    <Circle cx={18.5} cy={16.5} r={3.5} />
    <Path d="M5.5 16.5L9 9h5l4.5 7.5M9 9L7.5 6H5M14 9l1-3h3" />
  </Trazo>
);

export const IconoPerfil = (p: Props) => (
  <Trazo {...p}>
    <Circle cx={12} cy={8} r={4} />
    <Path d="M4 21c1-4 4-6 8-6s7 2 8 6" />
  </Trazo>
);

export const IconoPreguntar = (p: Props) => (
  <Trazo {...p}>
    <Path d="M12 3l1.8 4.7L18.5 9.5l-4.7 1.8L12 16l-1.8-4.7L5.5 9.5l4.7-1.8z" />
    <Path d="M19 15l.8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8z" />
  </Trazo>
);

export const IconoLuna = (p: Props) => (
  <Trazo {...p}>
    <Path d="M20 14.5A8 8 0 0 1 9.5 4 8 8 0 1 0 20 14.5z" />
  </Trazo>
);

export const IconoSol = (p: Props) => (
  <Trazo {...p}>
    <Circle cx={12} cy={12} r={4} />
    <Path d="M12 2v2M12 20v2M2 12h2M20 12h2M5 5l1.5 1.5M17.5 17.5L19 19M19 5l-1.5 1.5M6.5 17.5L5 19" />
  </Trazo>
);

export const IconoAtras = (p: Props) => (
  <Trazo {...p}>
    <Path d="M15 5l-7 7 7 7" strokeWidth={2.6} />
  </Trazo>
);

export const IconoEscudo = (p: Props) => (
  <Trazo {...p}>
    <Path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z" />
  </Trazo>
);

export const IconoTelefono = (p: Props) => (
  <Trazo {...p}>
    <Rect x={6} y={2.5} width={12} height={19} rx={2.5} />
    <Path d="M11 18.5h2" />
  </Trazo>
);
