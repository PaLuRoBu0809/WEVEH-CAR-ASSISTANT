import 'react-native-url-polyfill/auto';

import { createClient } from '@supabase/supabase-js';
import { AppState } from 'react-native';

import { almacenSesion } from './almacenSesion';

const urlConfigurada = process.env.EXPO_PUBLIC_SUPABASE_URL;
const llaveConfigurada = process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

if (!urlConfigurada || !llaveConfigurada) {
  console.warn(
    'Faltan EXPO_PUBLIC_SUPABASE_URL o EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY: ' +
      'cuentas (login/registro) no va a funcionar hasta que estén en mobile/.env.',
  );
}

/**
 * La app solo habla con Supabase para iniciar sesión (docs/adr/0005); los datos van siempre por la API de WEVEH.
 * La llave publishable es pública por diseño: las tablas tienen RLS sin políticas.
 * Con un placeholder cuando falta la llave: createClient revienta de forma síncrona con string
 * vacío, lo que tumbaba toda la navegación en vez de solo la pantalla de cuentas.
 */
export const supabase = createClient(
  urlConfigurada || 'https://placeholder.supabase.co',
  llaveConfigurada || 'placeholder-sin-configurar',
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
