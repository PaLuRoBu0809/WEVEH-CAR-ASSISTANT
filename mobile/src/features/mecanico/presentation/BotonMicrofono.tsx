import {
  getRecordingPermissionsAsync,
  RecordingPresets,
  requestRecordingPermissionsAsync,
  setAudioModeAsync,
  useAudioRecorder,
  useAudioRecorderState,
} from 'expo-audio';
import { File } from 'expo-file-system';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, StyleSheet } from 'react-native';

import { IconoMicrofono, radio, TACTIL_MINIMO, useTema } from '@/shared/design-system';
import { ErrorApi, ErrorSinConexion, mensajeParaPersona } from '@/shared/http';

import { useTranscribir } from '../application/useConversacion';

/** RF-MIA-11: como mucho 60 segundos; el grabador se detiene solo. */
export const SEGUNDOS_MAXIMOS = 60;

/** Por debajo de este nivel (dBFS) no hubo voz: Whisper inventa frases con el silencio ("Gracias"). */
export const UMBRAL_VOZ_DB = -45;
/** Menos de esto no alcanza para una frase: fue un toque, no una grabación. */
export const DURACION_MINIMA_MS = 700;

export const NO_TE_ESCUCHE = 'No te escuché. Habla cerca del micrófono mientras lo mantienes pulsado.';
export const MUY_CORTO = 'Mantén pulsado el micrófono mientras hablas y suéltalo al terminar.';

export const EXPLICACION_MICROFONO =
  'Mantén pulsado para hablar. Un proveedor externo pasa tu voz a texto; el audio se borra apenas se transcribe y no se guarda. Antes de enviarlo podrás corregir el texto.';

type Props = Readonly<{
  /** El texto transcrito, para ponerlo en el campo y corregirlo antes de enviarlo. */
  onTexto: (texto: string) => void;
  onError: (mensaje: string) => void;
  deshabilitado?: boolean;
}>;

/** Mantener pulsado para grabar y soltar para transcribir (RF-MIA-11, RF-DAT-09). */
export function BotonMicrofono({ onTexto, onError, deshabilitado }: Props) {
  const tema = useTema();
  const grabador = useAudioRecorder({ ...RecordingPresets.HIGH_QUALITY, isMeteringEnabled: true });
  const estado = useAudioRecorderState(grabador, 100);
  const transcripcion = useTranscribir();
  const [grabando, setGrabando] = useState(false);
  const nivelMaximo = useRef<number | undefined>(undefined);

  useEffect(() => {
    if (!grabando || estado.metering === undefined) return;
    nivelMaximo.current = Math.max(nivelMaximo.current ?? -160, estado.metering);
  }, [grabando, estado.metering]);

  const empezar = async () => {
    if (!(await permiso())) return;
    await setAudioModeAsync({ allowsRecording: true, playsInSilentMode: true });
    await grabador.prepareToRecordAsync();
    nivelMaximo.current = undefined;
    grabador.record({ forDuration: SEGUNDOS_MAXIMOS });
    setGrabando(true);
  };

  const terminar = async () => {
    if (!grabando) return;
    setGrabando(false);
    const duracion = grabador.getStatus().durationMillis;
    await grabador.stop();
    const uri = grabador.uri;
    if (!uri) return;
    const problema = problemaDeLaGrabacion(duracion, nivelMaximo.current);
    if (problema) {
      // No se manda a Groq ni cuenta para el tope: no había nada que transcribir
      borrar(uri);
      onError(problema);
      return;
    }
    transcripcion.mutate(uri, {
      onSuccess: ({ texto }) => onTexto(texto),
      onError: (error) => onError(mensajeDeVoz(error)),
      onSettled: () => borrar(uri),
    });
  };

  const ocupado = transcripcion.isPending;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={grabando ? 'Grabando. Suelta para transcribir' : 'Mantén pulsado para hablar'}
      accessibilityHint={EXPLICACION_MICROFONO}
      disabled={deshabilitado || ocupado}
      onPressIn={() => void empezar()}
      onPressOut={() => void terminar()}
      style={[
        estilos.boton,
        { backgroundColor: grabando ? tema.errorTinte : tema.superficie, opacity: deshabilitado ? 0.5 : 1 },
      ]}>
      {ocupado ? (
        <ActivityIndicator color={tema.primario} />
      ) : (
        <IconoMicrofono color={grabando ? tema.errorTinta : tema.primarioTinta} tamano={22} />
      )}
    </Pressable>
  );
}

/** La primera vez explica qué pasa con la voz antes de que el sistema pida el permiso (RF-DAT-09). */
async function permiso(): Promise<boolean> {
  const actual = await getRecordingPermissionsAsync();
  if (actual.granted) return true;
  if (!actual.canAskAgain) {
    Alert.alert('Micrófono desactivado', 'Actívalo en los ajustes del celular para hablarle al Mecánico IA.');
    return false;
  }
  const acepto = await new Promise<boolean>((resolver) =>
    Alert.alert('Hablarle al Mecánico IA', EXPLICACION_MICROFONO, [
      { text: 'Ahora no', style: 'cancel', onPress: () => resolver(false) },
      { text: 'Continuar', onPress: () => resolver(true) },
    ]),
  );
  return acepto && (await requestRecordingPermissionsAsync()).granted;
}

/**
 * Antes de mandar el audio: un toque corto o una grabación sin voz no se transcriben. Si el celular no mide el nivel
 * (undefined), se manda igual y el backend filtra lo que Whisper inventa.
 */
export function problemaDeLaGrabacion(duracionMs: number, nivelMaximoDb: number | undefined): string | null {
  if (duracionMs < DURACION_MINIMA_MS) return MUY_CORTO;
  if (nivelMaximoDb !== undefined && nivelMaximoDb < UMBRAL_VOZ_DB) return NO_TE_ESCUCHE;
  return null;
}

/** RF-MIA-11: si el servicio no responde, se pide escribirlo; sin red o con el tope, se dice lo que pasa. */
export function mensajeDeVoz(error: unknown): string {
  if (error instanceof ErrorSinConexion || (error instanceof ErrorApi && error.status === 429)) {
    return mensajeParaPersona(error);
  }
  return 'No pude entender el audio, escríbelo.';
}

/** RF-DAT-09: el archivo local se borra apenas se transcribe, salga bien o mal. */
function borrar(uri: string): void {
  try {
    new File(uri).delete();
  } catch {
    // En la web la grabación es un blob en memoria: no hay archivo que borrar
  }
}

const estilos = StyleSheet.create({
  boton: {
    width: TACTIL_MINIMO + 4,
    height: TACTIL_MINIMO + 4,
    borderRadius: radio.total,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
