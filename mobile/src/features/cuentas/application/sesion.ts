import type { User } from '@supabase/supabase-js';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as WebBrowser from 'expo-web-browser';
import { useEffect } from 'react';
import { Platform } from 'react-native';
import { create } from 'zustand';

import { configurarSesion, ErrorApi } from '@/shared/http';

import {
  MEDIO_CONSENTIMIENTO,
  nombreDesdeMetadatos,
  VERSION_POLITICA,
  type DatosCrearCuenta,
} from '../domain/formularios';
import { mensajeDeAuth } from '../domain/mensajes';
import { crearPerfil, obtenerCuenta, type Cuenta } from '../infrastructure/apiCuenta';
import { supabase } from '../infrastructure/supabase';
import { urlDeRetorno } from '../infrastructure/urlDeRetorno';

export type EstadoSesion = 'cargando' | 'sin-sesion' | 'con-sesion';

/**
 * Cómo terminó una entrada: con el perfil listo, sin haber aceptado la política (pantalla "Antes de entrar") o
 * porque la persona cerró la ventana de Google.
 */
export type ResultadoEntrada =
  | Readonly<{ tipo: 'lista'; cuenta: Cuenta }>
  | Readonly<{ tipo: 'falta-politica' }>
  | Readonly<{ tipo: 'cancelada' }>;

export const CLAVE_CUENTA = ['cuenta'] as const;

/** Si la sesión se abrió hace poco: las acciones delicadas lo piden (RF-CTA-05, application/gestionCuenta.ts). */
export const CLAVE_SESION_RECIENTE = ['sesion-reciente'] as const;

/** Ruta a la que vuelve Google (app/(onboarding)/auth/callback.tsx). */
const RUTA_REGRESO_GOOGLE = 'auth/callback';

const SESION_TERMINADA = 'Tu sesión terminó. Inicia sesión de nuevo.';

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

/** Hay sesión pero no perfil en WEVEH: la persona salió de "Antes de entrar" sin aceptar la política. */
export function useFaltaPerfil(): boolean {
  const cuenta = useCuenta();
  return cuenta.error instanceof ErrorApi && cuenta.error.status === 404;
}

export type UsuarioDeSesion = Readonly<{ correo: string; conGoogle: boolean }>;

/** Con qué correo y por dónde entró, para "Entraste con Google como …". */
export function useUsuarioDeSesion(): UsuarioDeSesion | undefined {
  const estado = useEstadoSesion();
  const consulta = useQuery({
    queryKey: ['usuario-de-sesion'],
    queryFn: async (): Promise<UsuarioDeSesion | null> => {
      const usuario = (await supabase.auth.getSession()).data.session?.user;
      return usuario ? { correo: usuario.email ?? '', conGoogle: entroConGoogle(usuario) } : null;
    },
    enabled: estado === 'con-sesion',
  });
  return consulta.data ?? undefined;
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
      return entrar(data.user);
    },
    onSuccess: (resultado) => guardarCuenta(consultas, resultado),
  });
}

/**
 * RF-CTA-02: entra con Google. En la web la página se va a Google y vuelve a /auth/callback; en el celular se abre
 * una ventana del navegador que vuelve a la app con el código.
 * Con `siguiente`, sirve para confirmar la identidad (RF-CTA-05): en la web, /auth/callback devuelve a esa pantalla.
 */
export function useEntrarConGoogle() {
  const consultas = useQueryClient();
  return useMutation({
    mutationFn: async (siguiente?: string): Promise<ResultadoEntrada> => {
      const redirectTo = urlDeRetorno(RUTA_REGRESO_GOOGLE, siguiente ? { siguiente } : undefined);
      const enLaWeb = Platform.OS === 'web';
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo, skipBrowserRedirect: !enLaWeb },
      });
      if (error) {
        throw new Error(mensajeDeAuth(error));
      }
      if (enLaWeb) {
        // La página ya se está yendo a Google
        return { tipo: 'cancelada' };
      }
      const ventana = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);
      if (ventana.type !== 'success') {
        return { tipo: 'cancelada' };
      }
      return entrarConEnlace(new URL(ventana.url).searchParams);
    },
    onSuccess: (resultado) => {
      guardarCuenta(consultas, resultado);
      // Con una sesión nueva, la identidad queda confirmada (RF-CTA-05)
      void consultas.invalidateQueries({ queryKey: CLAVE_SESION_RECIENTE });
    },
  });
}

/**
 * /auth/callback: termina la entrada con Google con el código de la URL. Es una consulta y no una mutación para que
 * el código se canjee una sola vez aunque la pantalla se monte dos veces.
 */
export function useEntradaDesdeEnlace(parametros: Readonly<Record<string, string | undefined>>) {
  const consultas = useQueryClient();
  return useQuery({
    queryKey: ['entrada-desde-enlace', parametros.code ?? parametros.error_code ?? ''],
    queryFn: async () => {
      const resultado = await entrarConEnlace(new URLSearchParams(definidos(parametros)));
      guardarCuenta(consultas, resultado);
      return resultado;
    },
    retry: false,
    staleTime: Infinity,
    gcTime: Infinity,
  });
}

/** RF-DAT-01: acepta la política en "Antes de entrar" y crea el perfil (con Google, medio APP_GOOGLE). */
export function useAceptarPolitica() {
  const consultas = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const usuario = (await supabase.auth.getSession()).data.session?.user;
      if (!usuario) {
        throw new Error(SESION_TERMINADA);
      }
      return crearPerfil({
        nombre: nombreDesdeMetadatos(usuario.user_metadata),
        versionPolitica: VERSION_POLITICA,
        aceptadoEn: new Date().toISOString(),
        medio: entroConGoogle(usuario) ? MEDIO_CONSENTIMIENTO.google : MEDIO_CONSENTIMIENTO.registro,
      });
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

function guardarCuenta(consultas: ReturnType<typeof useQueryClient>, resultado: ResultadoEntrada) {
  if (resultado.tipo === 'lista') {
    consultas.setQueryData(CLAVE_CUENTA, resultado.cuenta);
  }
}

async function entrarConEnlace(parametros: URLSearchParams): Promise<ResultadoEntrada> {
  const codigoError = parametros.get('error_code') ?? parametros.get('error');
  const codigo = parametros.get('code');
  if (codigoError || !codigo) {
    throw new Error(mensajeDeAuth({ code: codigoError ?? undefined, status: 400, message: '' }));
  }
  const { error } = await supabase.auth.exchangeCodeForSession(codigo);
  const usuario = (await supabase.auth.getSession()).data.session?.user;
  // En Android el enlace de regreso puede llegar dos veces: si el código ya se canjeó, la sesión ya está
  if (!usuario) {
    throw new Error(error ? mensajeDeAuth(error) : SESION_TERMINADA);
  }
  return entrar(usuario);
}

/** Si algo falla después de entrar a Supabase, no deja una sesión sin perfil. */
async function entrar(usuario: User): Promise<ResultadoEntrada> {
  try {
    return await asegurarPerfil(usuario);
  } catch (errorPerfil) {
    await supabase.auth.signOut({ scope: 'local' });
    throw errorPerfil;
  }
}

async function asegurarPerfil(usuario: User): Promise<ResultadoEntrada> {
  try {
    return { tipo: 'lista', cuenta: await obtenerCuenta() };
  } catch (error) {
    if (!(error instanceof ErrorApi) || error.status !== 404) {
      throw error;
    }
  }
  const metadatos = usuario.user_metadata ?? {};
  // Con Google no hubo casilla: la política se acepta en "Antes de entrar"
  if (typeof metadatos.version_politica !== 'string') {
    return { tipo: 'falta-politica' };
  }
  const cuenta = await crearPerfil({
    nombre: nombreDesdeMetadatos(metadatos),
    versionPolitica: metadatos.version_politica,
    aceptadoEn: typeof metadatos.politica_aceptada_en === 'string' ? metadatos.politica_aceptada_en : undefined,
    medio: MEDIO_CONSENTIMIENTO.registro,
  });
  return { tipo: 'lista', cuenta };
}

function entroConGoogle(usuario: User): boolean {
  return usuario.app_metadata?.provider === 'google';
}

function definidos(parametros: Readonly<Record<string, string | undefined>>): Record<string, string> {
  return Object.fromEntries(Object.entries(parametros).filter((par): par is [string, string] => par[1] !== undefined));
}
