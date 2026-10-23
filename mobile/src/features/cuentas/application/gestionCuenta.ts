import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { ErrorApi } from '@/shared/http';
import { borrarDatosLocales } from '@/shared/sinRed';

import { esSesionReciente } from '../domain/gestionCuenta';
import { mensajeDeAuth } from '../domain/mensajes';
import { editarNombre, eliminarCuenta } from '../infrastructure/apiCuenta';
import { supabase } from '../infrastructure/supabase';
import { guardarContrasena } from './enlacesCorreo';
import { CLAVE_CUENTA, CLAVE_SESION_RECIENTE } from './sesion';

const CONTRASENA_INCORRECTA = 'Esa no es tu contraseña actual. Revísala e intenta de nuevo.';
const SESION_TERMINADA = 'Tu sesión terminó. Inicia sesión de nuevo.';

/**
 * RF-CTA-05: si la sesión se abrió hace poco, la identidad está confirmada. Se revisa cada 30 s, porque deja de
 * serlo con el tiempo.
 */
export function useSesionReciente(): boolean {
  const consulta = useQuery({
    queryKey: CLAVE_SESION_RECIENTE,
    queryFn: async () => {
      const token = (await supabase.auth.getSession()).data.session?.access_token;
      return esSesionReciente(emitidoEn(token), Date.now());
    },
    refetchInterval: 30_000,
  });
  return consulta.data === true;
}

/** RF-CTA-05 con contraseña: volver a entrar abre una sesión nueva. Con Google se usa useEntrarConGoogle. */
export function useConfirmarIdentidad() {
  const consultas = useQueryClient();
  return useMutation({
    mutationFn: comprobarContrasena,
    onSuccess: () => consultas.invalidateQueries({ queryKey: CLAVE_SESION_RECIENTE }),
  });
}

/** RF-CTA-07 / RF-DAT-05. */
export function useEditarNombre() {
  const consultas = useQueryClient();
  return useMutation({
    mutationFn: (nombre: string) => editarNombre(nombre.trim()),
    onSuccess: (cuenta) => consultas.setQueryData(CLAVE_CUENTA, cuenta),
  });
}

/**
 * RF-CTA-07: con "Secure email change", Supabase manda un enlace al correo actual y otro al nuevo; el cambio queda
 * cuando se abren los dos (página /correo-cambiado).
 */
export function useCambiarCorreo() {
  return useMutation({
    mutationFn: async (nuevo: string) => {
      const limpio = nuevo.trim();
      const { error } = await supabase.auth.updateUser({ email: limpio });
      if (error) {
        throw new Error(
          error.code === 'email_exists' ? 'Ese correo ya lo usa otra cuenta de WEVEH.' : mensajeDeAuth(error),
        );
      }
      return limpio;
    },
  });
}

/** Cambiar la contraseña desde Mis datos: primero la actual, luego la nueva; se cierran las demás sesiones. */
export function useCambiarContrasena() {
  return useMutation({
    mutationFn: async ({ actual, nueva }: Readonly<{ actual: string; nueva: string }>) => {
      await comprobarContrasena(actual);
      await guardarContrasena(nueva);
    },
  });
}

/**
 * RF-DAT-06 y RF-DAT-07: borra la cuenta y todo lo suyo, aquí y en Supabase, y cierra la sesión en el celular. Si la
 * sesión ya no es reciente, el backend responde 401 y la pantalla vuelve a pedir la identidad.
 */
export function useEliminarCuenta() {
  const consultas = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      try {
        await eliminarCuenta();
      } catch (error) {
        if (esIdentidadNoConfirmada(error)) {
          await consultas.invalidateQueries({ queryKey: CLAVE_SESION_RECIENTE });
        }
        throw error;
      }
      await supabase.auth.signOut({ scope: 'local' });
    },
    onSuccess: async () => {
      consultas.clear();
      await borrarDatosLocales();
    },
  });
}

function esIdentidadNoConfirmada(error: unknown): boolean {
  return error instanceof ErrorApi && error.status === 401 && Boolean(error.problema.type?.endsWith('/identidad-no-confirmada'));
}

async function comprobarContrasena(contrasena: string): Promise<void> {
  const correo = (await supabase.auth.getSession()).data.session?.user.email;
  if (!correo) {
    throw new Error(SESION_TERMINADA);
  }
  const { error } = await supabase.auth.signInWithPassword({ email: correo, password: contrasena });
  if (error) {
    throw new Error(error.code === 'invalid_credentials' ? CONTRASENA_INCORRECTA : mensajeDeAuth(error));
  }
}

/** El "iat" (segundos) del token de Supabase, sin validar la firma: solo decide si pedir la identidad otra vez. */
function emitidoEn(token: string | undefined): number | undefined {
  const carga = token?.split('.')[1];
  if (!carga) {
    return undefined;
  }
  try {
    const json = atob(carga.replace(/-/g, '+').replace(/_/g, '/'));
    const iat = (JSON.parse(json) as { iat?: unknown }).iat;
    return typeof iat === 'number' ? iat : undefined;
  } catch {
    return undefined;
  }
}
