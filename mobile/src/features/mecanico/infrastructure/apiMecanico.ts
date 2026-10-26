import { File } from 'expo-file-system';
import { Platform } from 'react-native';

import { pedir } from '@/shared/http';

import type { Conversacion, ConversacionResumen, RespuestaMecanico } from '../domain/diagnostico';

const ruta = (vehiculoId: string) => `/api/v1/vehiculos/${vehiculoId}/conversaciones`;

export function crearConversacion(vehiculoId: string): Promise<{ id: string; creada: string }> {
  return pedir(ruta(vehiculoId), { method: 'POST' });
}

export function listarConversaciones(vehiculoId: string): Promise<ConversacionResumen[]> {
  return pedir(ruta(vehiculoId));
}

export function verConversacion(vehiculoId: string, conversacionId: string): Promise<Conversacion> {
  return pedir(`${ruta(vehiculoId)}/${conversacionId}`);
}

export function enviarMensaje(vehiculoId: string, conversacionId: string, texto: string): Promise<RespuestaMecanico> {
  return pedir(`${ruta(vehiculoId)}/${conversacionId}/mensajes`, { method: 'POST', body: JSON.stringify({ texto }) });
}

/** RF-MIA-11: el audio va como archivo; el backend lo transcribe en memoria y no lo guarda. */
export async function transcribir(uri: string): Promise<{ texto: string }> {
  const formulario = new FormData();
  if (Platform.OS === 'web') {
    // En la demo web la grabación es un blob: del navegador
    formulario.append('audio', await (await fetch(uri)).blob(), 'voz.webm');
  } else {
    // El fetch global de Expo (expo/fetch) no acepta el { uri, name, type } de React Native: lee un File de
    // expo-file-system, que trae los bytes, el nombre con su extensión (.m4a) y el tipo
    formulario.append('audio', new File(uri) as unknown as Blob);
  }
  return pedir('/api/v1/transcripciones', { method: 'POST', body: formulario });
}
