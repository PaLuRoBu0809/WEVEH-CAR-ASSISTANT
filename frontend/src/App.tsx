import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { RotateCcw } from 'lucide-react';
import { BotonMotorWeveh } from './components/BotonMotorWeveh';
import { EntradaSintomas } from './components/EntradaSintomas';
import { TarjetaResultadoDiagnostico } from './components/TarjetaResultadoDiagnostico';
import { useDiagnostico } from './hooks/useDiagnostico';
import { VEHICULO_VACIO, type DatosVehiculo } from './types/diagnostico';

export default function App() {
  const [sintoma, setSintoma] = useState('');
  const [vehiculo, setVehiculo] = useState<DatosVehiculo>(VEHICULO_VACIO);
  const { diagnostico, estaProcesando, mensajeError, solicitarDiagnostico, reiniciarDiagnostico } =
    useDiagnostico();

  const hayResultado = diagnostico !== null;

  function manejarConsulta() {
    void solicitarDiagnostico(sintoma, vehiculo);
  }

  function manejarNuevaConsulta() {
    reiniciarDiagnostico();
    setSintoma('');
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-3xl flex-col items-center gap-8 px-5 py-12 sm:py-16">
      <motion.header
        layout
        className="text-center"
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
      >
        <p className="mb-2 text-xs font-extrabold tracking-[0.3em] text-weveh-humo uppercase">
          weveh
        </p>
        <h1 className="text-3xl leading-tight font-extrabold text-balance text-weveh-carbon sm:text-4xl">
          Tu mecánico experto en el bolsillo
        </h1>
        <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-weveh-humo">
          Cuéntanos qué suena raro. Te decimos qué puede ser, qué tan grave es y qué hacer ahora
          mismo.
        </p>
      </motion.header>

      <EntradaSintomas
        sintoma={sintoma}
        onCambiarSintoma={setSintoma}
        vehiculo={vehiculo}
        onCambiarVehiculo={setVehiculo}
        estaDeshabilitado={estaProcesando}
      />

      <BotonMotorWeveh
        onPresionar={manejarConsulta}
        estaProcesando={estaProcesando}
        estaDeshabilitado={!sintoma.trim()}
        nivelEncendido={diagnostico?.nivel_gravedad ?? null}
        estaCompacto={hayResultado}
      />

      {/* Error y resultado son mutuamente excluyentes, pero nunca comparten el modo "wait". */}
      <AnimatePresence>
        {mensajeError && (
          <motion.p
            key="error"
            role="alert"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="w-full max-w-xl rounded-2xl bg-weveh-fondo px-5 py-4 text-center text-sm font-semibold text-gravedad-critico shadow-hendidura"
          >
            {mensajeError}
          </motion.p>
        )}

        {diagnostico && (
          <motion.div
            key="resultado"
            layout
            className="flex w-full flex-col items-center gap-5"
          >
            <TarjetaResultadoDiagnostico diagnostico={diagnostico} />

            <button
              type="button"
              onClick={manejarNuevaConsulta}
              className="inline-flex items-center gap-2 rounded-full bg-weveh-fondo px-5 py-2.5 text-sm font-bold text-weveh-humo shadow-relieve-suave transition-shadow duration-200 active:shadow-hendidura"
            >
              <RotateCcw size={15} strokeWidth={2.6} aria-hidden="true" />
              Consultar otro síntoma
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}
