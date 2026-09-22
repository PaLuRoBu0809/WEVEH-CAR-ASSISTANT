import { Car } from 'lucide-react';
import type { DatosVehiculo } from '../types/diagnostico';

interface PropsEntradaSintomas {
  sintoma: string;
  onCambiarSintoma: (sintoma: string) => void;
  vehiculo: DatosVehiculo;
  onCambiarVehiculo: (vehiculo: DatosVehiculo) => void;
  estaDeshabilitado: boolean;
}

const CLASES_CAMPO_VEHICULO =
  'w-full rounded-2xl bg-weveh-fondo px-4 py-2.5 text-sm text-weveh-carbon shadow-hendidura outline-none placeholder:text-weveh-humo/60 disabled:opacity-60';

/** Panel hundido en el tablero: el sintoma en texto libre mas el perfil minimo del vehiculo. */
export function EntradaSintomas({
  sintoma,
  onCambiarSintoma,
  vehiculo,
  onCambiarVehiculo,
  estaDeshabilitado,
}: PropsEntradaSintomas) {
  return (
    <section className="w-full max-w-xl">
      <label
        htmlFor="campo-sintoma"
        className="mb-3 block text-center text-sm font-semibold text-weveh-humo"
      >
        ¿Qué está haciendo tu vehículo?
      </label>

      <div className="rounded-[28px] bg-weveh-fondo p-2 shadow-hendidura-profunda">
        <textarea
          id="campo-sintoma"
          value={sintoma}
          onChange={(evento) => onCambiarSintoma(evento.target.value)}
          disabled={estaDeshabilitado}
          rows={4}
          placeholder="Ej: al frenar suena un chillido fuerte y el pedal vibra un poco…"
          className="w-full resize-none rounded-3xl bg-transparent px-5 py-4 text-base leading-relaxed text-weveh-carbon outline-none placeholder:text-weveh-humo/60 disabled:opacity-60"
        />

        <div className="mt-1 border-t border-weveh-sombra/40 px-3 pt-3 pb-2">
          <p className="mb-2.5 flex items-center gap-1.5 text-xs font-semibold text-weveh-humo">
            <Car size={14} strokeWidth={2.4} aria-hidden="true" />
            Tu vehículo
            <span className="font-normal text-weveh-humo/70">
              — sin estos datos no podemos estimar costos
            </span>
          </p>

          <div className="grid grid-cols-3 gap-2">
            <input
              aria-label="Marca del vehículo"
              value={vehiculo.marca}
              onChange={(evento) => onCambiarVehiculo({ ...vehiculo, marca: evento.target.value })}
              disabled={estaDeshabilitado}
              placeholder="Marca"
              className={CLASES_CAMPO_VEHICULO}
            />
            <input
              aria-label="Modelo del vehículo"
              value={vehiculo.modelo}
              onChange={(evento) => onCambiarVehiculo({ ...vehiculo, modelo: evento.target.value })}
              disabled={estaDeshabilitado}
              placeholder="Modelo"
              className={CLASES_CAMPO_VEHICULO}
            />
            <input
              aria-label="Año del vehículo"
              value={vehiculo.anio}
              onChange={(evento) => onCambiarVehiculo({ ...vehiculo, anio: evento.target.value })}
              disabled={estaDeshabilitado}
              inputMode="numeric"
              placeholder="Año"
              className={CLASES_CAMPO_VEHICULO}
            />
          </div>
        </div>
      </div>
    </section>
  );
}
