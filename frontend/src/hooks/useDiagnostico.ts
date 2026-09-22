import { useCallback, useState } from 'react';
import {
  MENSAJES_ERROR,
  VEHICULO_VACIO,
  type DatosVehiculo,
  type DiagnosticoRecibido,
  type ErrorRecibido,
} from '../types/diagnostico';

const URL_BASE_API = import.meta.env.VITE_URL_API_WEVEH ?? '';
const ENDPOINT_DIAGNOSTICO = `${URL_BASE_API}/api/diagnosticos`;

interface EstadoDiagnostico {
  diagnostico: DiagnosticoRecibido | null;
  estaProcesando: boolean;
  mensajeError: string | null;
  solicitarDiagnostico: (sintoma: string, vehiculo: DatosVehiculo) => Promise<void>;
  reiniciarDiagnostico: () => void;
}

/** Convierte el formulario en el payload camelCase que espera SolicitudDiagnosticoDto. */
function construirCuerpoSolicitud(sintoma: string, vehiculo: DatosVehiculo) {
  const anioNumerico = Number.parseInt(vehiculo.anio, 10);
  return {
    sintoma: sintoma.trim(),
    vehiculo: {
      marca: vehiculo.marca.trim() || null,
      modelo: vehiculo.modelo.trim() || null,
      anio: Number.isNaN(anioNumerico) ? null : anioNumerico,
    },
  };
}

async function extraerMensajeDeError(respuesta: Response): Promise<string> {
  try {
    const cuerpo = (await respuesta.json()) as ErrorRecibido;
    return cuerpo.mensaje ?? MENSAJES_ERROR.RESPUESTA_INESPERADA;
  } catch {
    return MENSAJES_ERROR.RESPUESTA_INESPERADA;
  }
}

/**
 * Concentra todo el estado y la comunicacion con el backend.
 * Los componentes visuales no conocen fetch, URLs ni codigos HTTP.
 */
export function useDiagnostico(): EstadoDiagnostico {
  const [diagnostico, setDiagnostico] = useState<DiagnosticoRecibido | null>(null);
  const [estaProcesando, setEstaProcesando] = useState(false);
  const [mensajeError, setMensajeError] = useState<string | null>(null);

  const reiniciarDiagnostico = useCallback(() => {
    setDiagnostico(null);
    setMensajeError(null);
  }, []);

  const solicitarDiagnostico = useCallback(
    async (sintoma: string, vehiculo: DatosVehiculo = VEHICULO_VACIO) => {
      if (!sintoma.trim()) {
        setMensajeError(MENSAJES_ERROR.SINTOMA_VACIO);
        return;
      }

      setEstaProcesando(true);
      setMensajeError(null);
      setDiagnostico(null);

      try {
        const respuesta = await fetch(ENDPOINT_DIAGNOSTICO, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(construirCuerpoSolicitud(sintoma, vehiculo)),
        });

        if (!respuesta.ok) {
          setMensajeError(await extraerMensajeDeError(respuesta));
          return;
        }

        setDiagnostico((await respuesta.json()) as DiagnosticoRecibido);
      } catch {
        setMensajeError(MENSAJES_ERROR.SIN_CONEXION);
      } finally {
        setEstaProcesando(false);
      }
    },
    [],
  );

  return { diagnostico, estaProcesando, mensajeError, solicitarDiagnostico, reiniciarDiagnostico };
}
