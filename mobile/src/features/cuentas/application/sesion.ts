import type { User } from '@supabase/supabase-js';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { create } from 'zustand';

import { configurarSesion, ErrorApi } from '@/shared/http';

import { VERSION_POLITICA, type DatosCrearCuenta } from '../domain/formularios';
import { mensajeDeAuth } from '../domain/mensajes';
import { crearPerfil, obtenerCuenta, type Cuenta } from '../infrastructure/apiCuenta';
import { supabase } from '../infrastructure/supabase';

export type EstadoSesion = 'cargando' | 'sin-sesion' | 'con-sesion';

export const CLAVE_CUENTA = ['cuenta'] as const;

const useEstado = create<{ estado: EstadoSesion }>(() => ({ estado: 'cargando' }));

function fijar(estado: EstadoSesion) {
  useEstado.setState({ estado });
}

/**
 * Se llama una vez en el layout raíz: conecta el cliente HTTP con el token de Supabase y sigue los cambios de sesión.
 * Un 401 de la API cierra la sesión en el celular.
 */
export function usePrepararSesion(): EstadoSesion {
  useEffect(() => {
    configurarSesion({
      token: async () => (await supabase.auth.getSession()).data.session?.access_token ?? null,
      alVencer: () => {
        void supabase.auth.signOut({ scope: 'local' });
      },
    });
    supabase.auth
      .getSession()
      .then(({ data }) => fijar(data.session ? 'con-sesion' : 'sin-sesion'))
      .catch(() => fijar('sin-sesion'));
    const { data } = supabase.auth.onAuthStateChange((_evento, sesion) => fijar(sesion ? 'con-sesion' : 'sin-sesion'));
    return () => data.subscription.unsubscribe();
  }, []);
  return useEstado((s) => s.estado);
}

export function useEstadoSesion(): EstadoSesion {
  return useEstado((s) => s.estado);
}

export function useCuenta() {
  const estado = useEstadoSesion();
  return useQuery({ queryKey: CLAVE_CUENTA, queryFn: obtenerCuenta, enabled: estado === 'con-sesion' });
}

export type ResultadoCrearCuenta = Readonly<{ requiereVerificarCorreo: boolean; correo: string }>;

/** RF-CTA-01: crea la cuenta en Supabase Auth guardando el nombre y la aceptación de la política para el perfil. */
export function useCrearCuenta() {
  return useMutation({
    mutationFn: async (datos: DatosCrearCuenta): Promise<ResultadoCrearCuenta> => {
      const correo = datos.correo.trim();
      const { data, error } = await supabase.auth.signUp({
        email: correo,
        password: datos.contrasena,
        options: {
          data: {
            nombre: datos.nombre.trim(),
            version_politica: VERSION_POLITICA,
            politica_aceptada_en: new Date().toISOString(),
          },
        },
      });
      if (error) {
        throw new Error(mensajeDeAuth(error));
      }
      // Con la verificación de correo activa, Supabase no dice si el correo ya existía: devuelve un usuario sin identidades
      if (data.user && data.user.identities?.length === 0) {
        throw new Error('Ya existe una cuenta con ese correo. Inicia sesión.');
      }
      if (data.session && data.user) {
        await asegurarPerfil(data.user);
      }
      return { requiereVerificarCorreo: !data.session, correo };
    },
  });
}

/** RF-CTA-02: inicia sesión y, la primera vez, crea el perfil en WEVEH. */
export function useIniciarSesion() {
  const consultas = useQueryClient();
  return useMutation({
    mutationFn: async ({ correo, contrasena }: { correo: string; contrasena: string }) => {
      const { data, error } = await supabase.auth.signInWithPassword({ email: correo.trim(), password: contrasena });
      if (error) {
        throw new Error(mensajeDeAuth(error));
      }
      try {
        return await asegurarPerfil(data.user);
      } catch (errorPerfil) {
        await supabase.auth.signOut({ scope: 'local' });
        throw errorPerfil;
      }
    },
    onSuccess: (cuenta) => consultas.setQueryData(CLAVE_CUENTA, cuenta),
  });
}

/** RF-CTA-06: cierra la sesión y borra lo guardado en el celular. */
export function useCerrarSesion() {
  const consultas = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      await supabase.auth.signOut({ scope: 'local' });
    },
    onSettled: () => consultas.clear(),
  });
}

async function asegurarPerfil(usuario: User): Promise<Cuenta> {
  try {
    return await obtenerCuenta();
  } catch (error) {
    if (!(error instanceof ErrorApi) || error.status !== 404) {
      throw error;
    }
  }
  const metadatos = usuario.user_metadata ?? {};
  if (typeof metadatos.version_politica !== 'string') {
    throw new Error('Para continuar debes aceptar la política de tratamiento de datos.');
  }
  return crearPerfil({
    nombre: typeof metadatos.nombre === 'string' && metadatos.nombre ? metadatos.nombre : 'Sin nombre',
    versionPolitica: metadatos.version_politica,
    aceptadoEn: typeof metadatos.politica_aceptada_en === 'string' ? metadatos.politica_aceptada_en : undefined,
  });
}
