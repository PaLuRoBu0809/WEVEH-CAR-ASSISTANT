import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { getRecordingPermissionsAsync, requestRecordingPermissionsAsync } from 'expo-audio';
import { File } from 'expo-file-system';
import { Alert } from 'react-native';

import { ErrorApi } from '@/shared/http';

import { useTranscribir } from '../application/useConversacion';
import { BotonMicrofono, MUY_CORTO, NO_TE_ESCUCHE } from './BotonMicrofono';

const mockGrabador = {
  prepareToRecordAsync: jest.fn(),
  record: jest.fn(),
  stop: jest.fn(),
  getStatus: jest.fn(() => ({ durationMillis: 3000 })),
  uri: 'file:///voz.m4a' as string | null,
};
let mockNivel: number | undefined = -20;

jest.mock('react-native-safe-area-context', () => jest.requireActual('react-native-safe-area-context/jest/mock').default);
jest.mock('expo-audio', () => ({
  useAudioRecorder: () => mockGrabador,
  useAudioRecorderState: () => ({ metering: mockNivel }),
  RecordingPresets: { HIGH_QUALITY: {} },
  getRecordingPermissionsAsync: jest.fn(),
  requestRecordingPermissionsAsync: jest.fn(),
  setAudioModeAsync: jest.fn(),
}));
jest.mock('expo-file-system', () => ({ File: jest.fn().mockImplementation(() => ({ delete: jest.fn() })) }));
jest.mock('../application/useConversacion', () => ({ useTranscribir: jest.fn() }));

type OpcionesTranscripcion = { onSuccess?: (r: { texto: string }) => void; onError?: (e: unknown) => void; onSettled?: () => void };

function transcripcion(resultado: { texto?: string; error?: unknown }) {
  const mutate = jest.fn((_uri: string, opciones: OpcionesTranscripcion) => {
    if (resultado.error) opciones.onError?.(resultado.error);
    else opciones.onSuccess?.({ texto: resultado.texto ?? '' });
    opciones.onSettled?.();
  });
  jest.mocked(useTranscribir).mockReturnValue({ isPending: false, mutate } as unknown as ReturnType<typeof useTranscribir>);
  return mutate;
}

async function grabarYSoltar() {
  const boton = screen.getByLabelText('Mantén pulsado para hablar');
  await fireEvent(boton, 'pressIn');
  await waitFor(() => expect(mockGrabador.record).toHaveBeenCalled());
  await fireEvent(screen.getByLabelText('Grabando. Suelta para transcribir'), 'pressOut');
}

beforeEach(() => {
  jest.clearAllMocks();
  mockNivel = -20;
  mockGrabador.uri = 'file:///voz.m4a';
  mockGrabador.getStatus.mockReturnValue({ durationMillis: 3000 });
  jest.mocked(getRecordingPermissionsAsync).mockResolvedValue({ granted: true, canAskAgain: true } as never);
});

describe('micrófono del Mecánico IA (RF-MIA-11, RF-DAT-09)', () => {
  test('graba hasta 60 s, transcribe al soltar, devuelve el texto y borra el archivo', async () => {
    const mutate = transcripcion({ texto: 'suena un chillido' });
    const onTexto = jest.fn();
    await render(<BotonMicrofono onTexto={onTexto} onError={jest.fn()} />);

    await grabarYSoltar();

    await waitFor(() => expect(onTexto).toHaveBeenCalledWith('suena un chillido'));
    expect(mockGrabador.record).toHaveBeenCalledWith({ forDuration: 60 });
    expect(mutate).toHaveBeenCalledWith('file:///voz.m4a', expect.anything());
    expect(File).toHaveBeenCalledWith('file:///voz.m4a');
  });

  test('un toque corto no se manda', async () => {
    const mutate = transcripcion({ texto: 'x' });
    mockGrabador.getStatus.mockReturnValue({ durationMillis: 200 });
    const onError = jest.fn();
    await render(<BotonMicrofono onTexto={jest.fn()} onError={onError} />);

    await grabarYSoltar();

    await waitFor(() => expect(onError).toHaveBeenCalledWith(MUY_CORTO));
    expect(mutate).not.toHaveBeenCalled();
  });

  test('sin voz no se manda a Groq', async () => {
    const mutate = transcripcion({ texto: 'Gracias.' });
    mockNivel = -70;
    const onError = jest.fn();
    await render(<BotonMicrofono onTexto={jest.fn()} onError={onError} />);

    await grabarYSoltar();

    await waitFor(() => expect(onError).toHaveBeenCalledWith(NO_TE_ESCUCHE));
    expect(mutate).not.toHaveBeenCalled();
  });

  test('si el servicio falla pide escribirlo', async () => {
    transcripcion({ error: new ErrorApi(503, { type: 'https://weveh.co/problemas/no-disponible' }) });
    const onError = jest.fn();
    await render(<BotonMicrofono onTexto={jest.fn()} onError={onError} />);

    await grabarYSoltar();

    await waitFor(() => expect(onError).toHaveBeenCalledWith('No pude entender el audio, escríbelo.'));
  });

  test('la primera vez explica qué pasa con la voz antes de pedir el permiso', async () => {
    transcripcion({ texto: 'hola' });
    jest.mocked(getRecordingPermissionsAsync).mockResolvedValue({ granted: false, canAskAgain: true } as never);
    jest.mocked(requestRecordingPermissionsAsync).mockResolvedValue({ granted: true } as never);
    const alerta = jest.spyOn(Alert, 'alert').mockImplementation((_t, _m, botones) => botones?.[1]?.onPress?.());
    await render(<BotonMicrofono onTexto={jest.fn()} onError={jest.fn()} />);

    await fireEvent(screen.getByLabelText('Mantén pulsado para hablar'), 'pressIn');

    await waitFor(() => expect(mockGrabador.record).toHaveBeenCalled());
    expect(alerta.mock.calls[0][1]).toMatch(/no se guarda/);
    expect(requestRecordingPermissionsAsync).toHaveBeenCalled();
  });

  test('si dice "Ahora no" no graba', async () => {
    transcripcion({ texto: 'hola' });
    jest.mocked(getRecordingPermissionsAsync).mockResolvedValue({ granted: false, canAskAgain: true } as never);
    jest.spyOn(Alert, 'alert').mockImplementation((_t, _m, botones) => botones?.[0]?.onPress?.());
    await render(<BotonMicrofono onTexto={jest.fn()} onError={jest.fn()} />);

    await fireEvent(screen.getByLabelText('Mantén pulsado para hablar'), 'pressIn');

    await waitFor(() => expect(Alert.alert).toHaveBeenCalled());
    expect(mockGrabador.record).not.toHaveBeenCalled();
    expect(requestRecordingPermissionsAsync).not.toHaveBeenCalled();
  });

  test('con el micrófono bloqueado indica activarlo en ajustes', async () => {
    transcripcion({ texto: 'hola' });
    jest.mocked(getRecordingPermissionsAsync).mockResolvedValue({ granted: false, canAskAgain: false } as never);
    const alerta = jest.spyOn(Alert, 'alert').mockImplementation(() => undefined);
    await render(<BotonMicrofono onTexto={jest.fn()} onError={jest.fn()} />);

    await fireEvent(screen.getByLabelText('Mantén pulsado para hablar'), 'pressIn');

    await waitFor(() => expect(alerta).toHaveBeenCalledWith('Micrófono desactivado', expect.stringMatching(/ajustes/)));
    expect(mockGrabador.record).not.toHaveBeenCalled();
  });
});
