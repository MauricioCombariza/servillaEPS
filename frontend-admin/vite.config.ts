
// frontend-admin/vite.config.ts
import { defineConfig } from 'vite'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa' // 1. Importar

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    // 2. Añadir el plugin con configuración básica
    VitePWA({ 
      registerType: 'autoUpdate',
      manifest: {
        name: 'Farma App Mensajero',
        short_name: 'FarmaApp',
        description: 'Aplicación para la gestión de entregas de farmacia.',
        theme_color: '#1a6329', // Tu color 'darkser'
        icons: [
          // Necesitarás crear estos iconos y ponerlos en la carpeta 'public'
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      }
    })
  ],
})
