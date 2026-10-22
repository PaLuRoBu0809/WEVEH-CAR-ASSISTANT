import { useMutation, useQuery } from '@tanstack/react-query';

import { esLimiteDeEnvios, mensajeDeAuth } from '../domain/mensajes';
import { supabase } from '../infrastructure/supabase';

/**
 * Los enlaces del correo abren páginas de la demo web con token_hash (docs/adr/0022): se verifican con verifyOtp,
 * que sirve en cualquier equipo. El código PKCE solo serviría en el navegador o celular que pidió el correo.
 */
export type TipoEnlace = 'recovery' | 'email';

/**
 * RF-CTA-03 y RF-CTA-04: verifica el enlace del correo una sola vez (una consulta, aunque la página se monte dos
 * veces). Un enlace vencido o ya usado termina en error.
 * Al confirmar el correo se cierra la sesión que abre el enlace: el perfil se crea al iniciar sesión.
 */
export function useVerificarEnlace(tipo: TipoEnlace, tokenHash: string | undefined) {
  return useQuery({
    queryKey: ['enlace-correo', tipo, tokenHash],
    queryFn: async () => {
      if (!tokenHash) {
        throw new Error(mensajeDeAuth({ code: 'otp_expired', status: 403, message: '' }));
      }
      const { error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type: tipo });
      if (error) {
        throw new Error(mensajeDeAuth(error));
      }
      if (tipo === 'email') {
        await supabase.auth.signOut({ scope: 'local' });
      }
      return true;
    },
    retry: false,
    staleTime: Infinity,
    gcTime: Infinity,
  });
}

/**
 * RF-CTA-03: pide el correo para crear una contraseña nueva. Nunca dice si la cuenta existe: cualquier respuesta de
 * Supabase se muestra como "Enlace enviado", salvo el límite de envíos.
 */
export function usePedirRecuperacion() {
  return useMutation({
    mutationFn: async (correo: string) => {
      const limpio = correo.trim();
      const { error } = await supabase.auth.resetPasswordForEmail(limpio);
      if (error && esLimiteDeEnvios(error)) {
        throw new Error(mensajeDeAuth(error));
      }
      return limpio;
    },
  });
}

/** RF-CTA-04: vuelve a enviar el correo de confirmación, con la misma reserva sobre si la cuenta existe. */
export function useReenviarVerificacion() {
  return useMutation({
    mutationFn: async (correo: string) => {
      const { error } = await supabase.auth.resend({ type: 'signup', email: correo.trim() });
      if (error && esLimiteDeEnvios(error)) {
        throw new Error(mensajeDeAuth(error));
      }
    },
  });
}

/** RF-CTA-03: guarda la contraseña nueva y cierra las demás sesiones abiertas (otros celulares o navegadores). */
export function useGuardarNuevaContrasena() {
  return useMutation({
    mutationFn: async (contrasena: string) => {
      const { error } = await supabase.auth.updateUser({ password: contrasena });
      if (error) {
        throw new Error(mensajeDeAuth(error));
      }
      await supabase.auth.signOut({ scope: 'others' });
    },
  });
}
