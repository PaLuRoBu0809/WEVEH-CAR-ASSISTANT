import { fireEvent, render, screen } from '@testing-library/react-native';

import { useVehiculos } from '@/features/garaje';
import { ErrorApi, ErrorSinConexion } from '@/shared/http';
import { useConexion } from '@/shared/sinRed';

import { useConversacion, useConversaciones, useEnviarMensaje } from '../application/useConversacion';
import type { Diagnostico, Mensaje } from '../domain/diagnostico';
import { mensajeDeVoz, MUY_CORTO, NO_TE_ESCUCHE, problemaDeLaGrabacion } from './BotonMicrofono';
import { AVISO_DATOS_PERSONALES, PantallaPreguntar, SIN_CONEXION } from './PantallaPreguntar';

jest.mock('react-native-safe-area-context', () => jest.requireActual('react-native-safe-area-context/jest/mock').default);
jest.mock('@/shared/sinRed', () => ({ useConexion: jest.fn() }));
jest.mock('@/features/garaje', () => ({
  useVehiculos: jest.fn(),
  nombreParaMostrar: (v: { alias?: string; linea: string }) => v.alias ?? v.linea,
}));
jest.mock('expo-audio', () => ({
  useAudioRecorder: () => ({ prepareToRecordAsync: jest.fn(), record: jest.fn(), stop: jest.fn(), getStatus: () => ({ durationMillis: 0 }), uri: null }),
  useAudioRecorderState: () => ({ metering: undefined }),
  RecordingPresets: { HIGH_QUALITY: {} },
  getRecordingPermissionsAsync: jest.fn(),
  requestRecordingPermissionsAsync: jest.fn(),
  setAudioModeAsync: jest.fn(),
}));
jest.mock('expo-file-system', () => ({ File: jest.fn() }));
jest.mock('../application/useConversacion', () => ({
  useConversacion: jest.fn(),
  useConversaciones: jest.fn(),
  useEnviarMensaje: jest.fn(),
  useTranscribir: () => ({ isPending: false, mutate: jest.fn() }),
}));

const PRADO = { id: 'v1', alias: 'La Prado', marca: 'TOYOTA', linea: 'PRADO VX', anioModelo: 2008 };

const TARJETA: Diagnostico = {
  posibleFalla: 'Pastillas de freno gastadas',
  nivel: 'CRITICO',
  gravedad: 'Crítico',
  plazo: 'NO_MANEJAR',
  textoPlazo: 'No manejes; llévalo hoy al mecánico',
  porQueImporta: 'El metal roza el disco.',
  pasos: ['Detén el vehículo en un lugar seguro.'],
  requiereRevisionHumana: true,
  requiereMecanico: true,
  piezasRelacionadas: ['pastillas_freno'],
  datosFaltantes: [],
  respuestaSegura: false,
  aviso: 'Orientación, no reemplaza al mecánico',
};

type OpcionesEnvio = { onSuccess?: (datos: { conversacionId: string }) => void };

function envio(estado: Record<string, unknown> = {}) {
  return {
    isPending: false,
    error: null,
    variables: undefined,
    reset: jest.fn(),
    mutate: jest.fn((_dato: unknown, opciones?: OpcionesEnvio) => opciones?.onSuccess?.({ conversacionId: 'c1' })),
    ...estado,
  };
}

function preparar({
  conectado = true,
  mensajes = [] as Mensaje[],
  anteriores = [] as { id: string; actualizada: string; primerMensaje: string }[],
  mutacion = envio(),
} = {}) {
  jest.mocked(useConexion).mockReturnValue(conectado);
  jest.mocked(useVehiculos).mockReturnValue({ data: [PRADO], isPending: false } as unknown as ReturnType<typeof useVehiculos>);
  jest.mocked(useConversacion).mockReturnValue({ data: { id: 'c1', mensajes }, isPending: false } as unknown as ReturnType<
    typeof useConversacion
  >);
  jest.mocked(useConversaciones).mockReturnValue({ data: anteriores } as unknown as ReturnType<typeof useConversaciones>);
  jest.mocked(useEnviarMensaje).mockReturnValue(mutacion as unknown as ReturnType<typeof useEnviarMensaje>);
  return mutacion;
}

const pantalla = () => render(<PantallaPreguntar onVolver={jest.fn()} onAgregarVehiculo={jest.fn()} />);

describe('Mecánico IA conversacional (RF-MIA-02, RF-DAT-08)', () => {
  test('pide el síntoma y avisa que no se escriban datos personales', async () => {
    preparar();
    await pantalla();

    expect(screen.getByText('¿Qué le pasa a tu vehículo?')).toBeTruthy();
    expect(screen.getByText(AVISO_DATOS_PERSONALES)).toBeTruthy();
  });

  test('envía el mensaje escrito y abre la conversación', async () => {
    const mutacion = preparar();
    await pantalla();

    await fireEvent.changeText(screen.getByLabelText('Mensaje para el Mecánico IA'), '  suena un chillido al frenar ');
    await fireEvent.press(screen.getByLabelText('Enviar'));

    expect(mutacion.mutate).toHaveBeenCalledWith({ conversacionId: null, texto: 'suena un chillido al frenar' }, expect.anything());
    expect(screen.getByText('Nueva conversación')).toBeTruthy();
  });

  test('un ejemplo llena el campo', async () => {
    preparar();
    await pantalla();

    await fireEvent.press(screen.getByText('¿Cada cuánto cambio el aceite?'));

    expect(screen.getByDisplayValue('¿Cada cuánto cambio el aceite?')).toBeTruthy();
  });

  test('muestra la conversación con la tarjeta y las dos preguntas del plazo', async () => {
    const mutacion = preparar({
      mensajes: [
        { rol: 'PERSONA', texto: 'no frena bien', tarjeta: null, creado: '2026-10-26T10:00:00Z' },
        { rol: 'MECANICO', texto: 'Podrían ser las pastillas.', tarjeta: TARJETA, creado: '2026-10-26T10:00:01Z' },
      ],
      anteriores: [{ id: 'c1', actualizada: '2026-10-26T10:00:01Z', primerMensaje: 'no frena bien' }],
    });
    await pantalla();
    await fireEvent.press(screen.getByText('no frena bien'));

    expect(screen.getByText('Podrían ser las pastillas.')).toBeTruthy();
    expect(screen.getByText('¿Puedo seguir manejando?')).toBeTruthy();
    expect(screen.getByText('No. Detente en un lugar seguro.')).toBeTruthy();
    expect(screen.getByText('¿Cuándo debo llevarlo?')).toBeTruthy();
    expect(screen.getByText('Hoy mismo.')).toBeTruthy();

    await fireEvent.press(screen.getByText('Nueva conversación'));
    expect(mutacion.reset).toHaveBeenCalled();
    expect(screen.getByText('¿Qué le pasa a tu vehículo?')).toBeTruthy();
  });

  test('sin conexión lo dice y no deja enviar', async () => {
    const mutacion = preparar({ conectado: false });
    await pantalla();

    await fireEvent.changeText(screen.getByLabelText('Mensaje para el Mecánico IA'), 'suena un chillido');
    await fireEvent.press(screen.getByLabelText('Enviar'));

    expect(screen.getByText(SIN_CONEXION)).toBeTruthy();
    expect(mutacion.mutate).not.toHaveBeenCalled();
  });

  test('el tope diario muestra el texto del backend', async () => {
    const error = new ErrorApi(429, { type: 'https://weveh.co/problemas/limite-diario', detail: 'Por hoy llegaste al máximo de mensajes. Vuelve mañana.' });
    preparar({ mutacion: envio({ error }) });
    await pantalla();

    expect(screen.getByText('Por hoy llegaste al máximo de mensajes. Vuelve mañana.')).toBeTruthy();
  });

  test('mientras responde muestra el mensaje enviado y que está revisando', async () => {
    preparar({ mutacion: envio({ isPending: true, variables: { conversacionId: null, texto: 'vibra a 80' } }) });
    await pantalla();

    expect(screen.getByText('vibra a 80')).toBeTruthy();
    expect(screen.getByText(/está revisando/)).toBeTruthy();
  });
});

describe('mensajes de la voz (RF-MIA-11)', () => {
  test('si el servicio falla pide escribirlo', () => {
    expect(mensajeDeVoz(new ErrorApi(503, { type: 'https://weveh.co/problemas/no-disponible' }))).toBe('No pude entender el audio, escríbelo.');
  });

  test('sin red o con el tope dice lo que pasa', () => {
    expect(mensajeDeVoz(new ErrorSinConexion())).toMatch(/internet/);
    expect(mensajeDeVoz(new ErrorApi(429, { detail: 'Por hoy llegaste al máximo de mensajes.' }))).toMatch(/máximo/);
  });
});

describe('antes de mandar el audio (RF-MIA-11)', () => {
  test('un toque corto no se manda', () => {
    expect(problemaDeLaGrabacion(300, -10)).toBe(MUY_CORTO);
  });

  test('una grabación sin voz no se manda, para que Whisper no invente "Gracias"', () => {
    expect(problemaDeLaGrabacion(3000, -60)).toBe(NO_TE_ESCUCHE);
  });

  test('con voz se manda', () => {
    expect(problemaDeLaGrabacion(3000, -20)).toBeNull();
  });

  test('si el celular no mide el nivel se manda igual y filtra el backend', () => {
    expect(problemaDeLaGrabacion(3000, undefined)).toBeNull();
  });
});
