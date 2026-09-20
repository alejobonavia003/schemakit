import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // Solo en desarrollo: las llamadas a /api se reenvían al backend.
    // En producción no hace falta, Express sirve el front y la API desde el mismo origen.
    // Dentro de Docker el backend se llama "backend" (compose define VITE_PROXY_TARGET).
    proxy: {
      '/api': {
        target: process.env.VITE_PROXY_TARGET || 'http://localhost:3000',
        changeOrigin: true,
      },
    },
  },
})
