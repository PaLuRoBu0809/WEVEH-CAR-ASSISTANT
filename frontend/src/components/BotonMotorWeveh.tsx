import { motion } from 'framer-motion';
import { AnilloTricolor } from './AnilloTricolor';
import type { NivelGravedad } from '../types/diagnostico';

interface PropsBotonMotorWeveh {
  onPresionar: () => void;
  estaProcesando: boolean;
  estaDeshabilitado: boolean;
  nivelEncendido?: NivelGravedad | null;
  /** El boton se reduce cuando la tarjeta de resultado toma el protagonismo. */
  estaCompacto?: boolean;
}

const ESCALA_COMPACTA = 0.72;

/** El "motor": nucleo neumorfico tactil rodeado por el anillo del logotipo. */
export function BotonMotorWeveh({
  onPresionar,
  estaProcesando,
  estaDeshabilitado,
  nivelEncendido = null,
  estaCompacto = false,
}: PropsBotonMotorWeveh) {
  const etiquetaAccesible = estaProcesando
    ? 'Analizando el síntoma del vehículo'
    : 'Diagnosticar mi vehículo';

  return (
    <motion.div
      layout
      animate={{ scale: estaCompacto ? ESCALA_COMPACTA : 1 }}
      transition={{ type: 'spring', stiffness: 220, damping: 24 }}
      className="relative grid h-44 w-44 place-items-center"
    >
      <AnilloTricolor estaGirando={estaProcesando} nivelEncendido={nivelEncendido} />

      <motion.button
        type="button"
        onClick={onPresionar}
        disabled={estaDeshabilitado || estaProcesando}
        aria-label={etiquetaAccesible}
        aria-busy={estaProcesando}
        whileTap={{ scale: 0.93 }}
        transition={{ type: 'spring', stiffness: 420, damping: 18 }}
        className="group relative grid h-28 w-28 place-items-center rounded-full bg-weveh-fondo shadow-relieve transition-shadow duration-200 active:shadow-hendidura-profunda disabled:cursor-not-allowed disabled:opacity-70"
      >
        <motion.span
          animate={estaProcesando ? { opacity: [1, 0.45, 1] } : { opacity: 1 }}
          transition={
            estaProcesando ? { duration: 1.6, repeat: Infinity, ease: 'easeInOut' } : { duration: 0.3 }
          }
          className="font-sans text-5xl leading-none font-extrabold tracking-tight text-weveh-carbon select-none"
        >
          w
        </motion.span>
      </motion.button>
    </motion.div>
  );
}
