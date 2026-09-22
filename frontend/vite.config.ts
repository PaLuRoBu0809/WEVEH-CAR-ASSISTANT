import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

const URL_BACKEND_LOCAL = process.env.VITE_URL_API_WEVEH ?? 'http://localhost:8080';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    // En desarrollo el frontend habla con Spring Boot sin configurar CORS.
    proxy: {
      '/api': { target: URL_BACKEND_LOCAL, changeOrigin: true },
    },
  },
});
