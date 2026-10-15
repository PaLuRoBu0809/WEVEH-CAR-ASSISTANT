import 'react-native-url-polyfill/auto';

import { createClient } from '@supabase/supabase-js';
import { AppState } from 'react-native';

import { almacenSesion } from './almacenSesion';

/**
 * La app solo habla con Supabase para iniciar sesión (docs/adr/0005); los datos van siempre por la API de WEVEH.
 * La llave publishable es pública por diseño: las tablas tienen RLS sin políticas.
 */
export const supabase = createClient(
  process.env.EXPO_PUBLIC_SUPABASE_URL ?? '',
  process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? '',
  {
    auth: {
      storage: almacenSesion,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
  },
);

// El token se renueva solo mientras la app está abierta (guía de Supabase para React Native)
AppState.addEventListener('change', (estado) => {
  if (estado === 'active') {
    supabase.auth.startAutoRefresh();
  } else {
    supabase.auth.stopAutoRefresh();
  }
});
