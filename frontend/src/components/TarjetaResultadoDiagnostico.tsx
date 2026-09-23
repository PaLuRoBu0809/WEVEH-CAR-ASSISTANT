import type { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { UserCheck, Wrench } from 'lucide-react';
import {
  DISCLAIMER_LEGAL,
  ETIQUETAS_GRAVEDAD,
  obtenerColorGravedad,
  type DiagnosticoRecibido,
} from '../types/diagnostico';

interface PropsTarjetaResultado {
  diagnostico: DiagnosticoRecibido;
}

interface PropsInsigniaEscalamiento {
  icono: typeof Wrench;
  texto: string;
  color: string;
}

function InsigniaEscalamiento({ icono: Icono, texto, color }: PropsInsigniaEscalamiento) {
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold"
      style={{ color, backgroundColor: `${color}1f` }}
    >
      <Icono size={13} strokeWidth={2.6} aria-hidden="true" />
      {texto}
    </span>
  );
}

interface PropsBloque {
  titulo: string;
  children: ReactNode;
}

function BloqueDiagnostico({ titulo, children }: PropsBloque) {
  return (
    <div>
      <h3 className="mb-1 text-[11px] font-extrabold tracking-[0.12em] text-weveh-humo uppercase">
        {titulo}
      </h3>
      <p className="text-[15px] leading-relaxed text-weveh-carbon">{children}</p>
    </div>
  );
}

/** Tarjeta glassmorphic cuyo semaforo se enciende con el color de la gravedad devuelta. */
export function TarjetaResultadoDiagnostico({ diagnostico }: PropsTarjetaResultado) {
  const colorGravedad = obtenerColorGravedad(diagnostico.nivel_gravedad);
  const necesitaEscalamiento =
    diagnostico.requires_human_review || diagnostico.requires_mechanic;

  return (
    <motion.article
      initial={{ opacity: 0, y: 28 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 16 }}
      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      className="w-full max-w-xl overflow-hidden rounded-[28px] border bg-white/60 backdrop-blur-xl"
      style={{
        borderColor: `${colorGravedad}59`,
        boxShadow: `0 18px 40px -20px ${colorGravedad}80, 0 8px 24px -12px rgba(45,45,48,0.18)`,
      }}
    >
      <div
        className="h-1.5 w-full"
        style={{ backgroundColor: colorGravedad, boxShadow: `0 0 16px ${colorGravedad}` }}
      />

      <div className="flex flex-col gap-5 p-6 sm:p-7">
        <header className="flex flex-wrap items-center justify-between gap-3">
          <span
            className="inline-flex items-center gap-2 text-sm font-extrabold"
            style={{ color: colorGravedad }}
          >
            <span
              className="h-2.5 w-2.5 rounded-full"
              style={{ backgroundColor: colorGravedad, boxShadow: `0 0 10px ${colorGravedad}` }}
              aria-hidden="true"
            />
            {diagnostico.nivel_gravedad}
          </span>
          <span className="text-xs font-semibold text-weveh-humo">
            {ETIQUETAS_GRAVEDAD[diagnostico.nivel_gravedad]}
          </span>
        </header>

        <BloqueDiagnostico titulo="Posible falla">
          <span className="text-lg font-extrabold">{diagnostico.posible_falla}</span>
        </BloqueDiagnostico>

        <BloqueDiagnostico titulo="Qué significa">
          {diagnostico.explicacion_simple}
        </BloqueDiagnostico>

        <div
          className="rounded-2xl p-4"
          style={{ backgroundColor: `${colorGravedad}14` }}
        >
          <BloqueDiagnostico titulo="Acción inmediata">
            <span className="font-bold">{diagnostico.accion_inmediata}</span>
          </BloqueDiagnostico>
        </div>

        <BloqueDiagnostico titulo="Costo estimado">
          {diagnostico.costo_estimado ?? (
            <span className="text-weveh-humo italic">
              No estimable con los datos disponibles — preferimos no inventar una cifra.
            </span>
          )}
        </BloqueDiagnostico>

        {necesitaEscalamiento && (
          <div className="flex flex-wrap gap-2 border-t border-weveh-sombra/50 pt-4">
            {diagnostico.requires_mechanic && (
              <InsigniaEscalamiento
                icono={Wrench}
                texto="Requiere mecánico presencial"
                color={colorGravedad}
              />
            )}
            {diagnostico.requires_human_review && (
              <InsigniaEscalamiento
                icono={UserCheck}
                texto="Requiere revisión humana"
                color={colorGravedad}
              />
            )}
          </div>
        )}

        <p className="text-[11px] leading-relaxed text-weveh-humo/80">{DISCLAIMER_LEGAL}</p>
      </div>
    </motion.article>
  );
}
