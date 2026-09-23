/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Base del backend Spring Boot. Vacia en desarrollo: el proxy de Vite resuelve /api. */
  readonly VITE_URL_API_WEVEH?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
