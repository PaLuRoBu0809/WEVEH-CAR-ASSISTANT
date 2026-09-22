import { motion, useReducedMotion } from 'framer-motion';
import {
  COLORES_SEMAFORO,
  ORDEN_SEGMENTOS_ANILLO,
  type NivelGravedad,
} from '../types/diagnostico';

const CENTRO = 60;
const RADIO = 46;
const GROSOR = 8;
const CIRCUNFERENCIA = 2 * Math.PI * RADIO;
const LONGITUD_TRAMO = CIRCUNFERENCIA / ORDEN_SEGMENTOS_ANILLO.length;
const PROPORCION_VISIBLE = 0.78;
const LONGITUD_ARCO = LONGITUD_TRAMO * PROPORCION_VISIBLE;

const OPACIDAD_SEGMENTO_APAGADO = 0.16;
const DURACION_GIRO_SEGUNDOS = 1.6;

interface PropsAnilloTricolor {
  estaGirando: boolean;
  /** Cuando llega un diagnostico, solo el segmento de esa gravedad queda encendido. */
  nivelEncendido?: NivelGravedad | null;
}

function calcularOpacidad(nivel: NivelGravedad, nivelEncendido?: NivelGravedad | null): number {
  if (!nivelEncendido) return 1;
  return nivel === nivelEncendido ? 1 : OPACIDAD_SEGMENTO_APAGADO;
}

function calcularResplandor(
  color: string,
  estaGirando: boolean,
  estaEncendido: boolean,
): string | undefined {
  if (estaGirando) return `drop-shadow(0 0 6px ${color})`;
  if (estaEncendido) return `drop-shadow(0 0 10px ${color})`;
  return undefined;
}

/** Anillo segmentado del logotipo: tres arcos independientes que giran y se encienden. */
export function AnilloTricolor({ estaGirando, nivelEncendido = null }: PropsAnilloTricolor) {
  const prefiereMenosMovimiento = useReducedMotion();
  const debeGirar = estaGirando && !prefiereMenosMovimiento;

  return (
    <motion.svg
      viewBox="0 0 120 120"
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 h-full w-full"
      animate={debeGirar ? { rotate: 360 } : { rotate: 0 }}
      transition={
        debeGirar
          ? { duration: DURACION_GIRO_SEGUNDOS, repeat: Infinity, ease: 'linear' }
          : { duration: 0.5, ease: 'easeOut' }
      }
      style={{ transformOrigin: 'center' }}
    >
      <g transform={`rotate(-90 ${CENTRO} ${CENTRO})`}>
        {ORDEN_SEGMENTOS_ANILLO.map((nivel, indice) => {
          const color = COLORES_SEMAFORO[nivel];
          const estaEncendido = nivelEncendido === nivel;

          return (
            <motion.circle
              key={nivel}
              cx={CENTRO}
              cy={CENTRO}
              r={RADIO}
              fill="none"
              stroke={color}
              strokeWidth={GROSOR}
              strokeLinecap="round"
              strokeDasharray={`${LONGITUD_ARCO} ${CIRCUNFERENCIA - LONGITUD_ARCO}`}
              strokeDashoffset={-LONGITUD_TRAMO * indice}
              initial={false}
              animate={{ opacity: calcularOpacidad(nivel, nivelEncendido) }}
              transition={{ duration: 0.45, ease: 'easeOut' }}
              style={{ filter: calcularResplandor(color, debeGirar, estaEncendido) }}
            />
          );
        })}
      </g>
    </motion.svg>
  );
}
