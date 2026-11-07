import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'apple-touch-icon.png'],
      manifest: {
        name: 'Caldeirão de Gaia',
        short_name: 'Caldeirão de Gaia',
        description: 'Controle de estoque doméstico compartilhado',
        theme_color: '#5B21B6',
        background_color: '#ffffff',
        display: 'standalone',
        orientation: 'portrait',
        icons: [
          { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png' }
        ]
      }
    })
  ],
  resolve: {
    alias: { '@': '/src' }
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.js',
    exclude: ['node_modules', 'dist', 'supabase/**', 'android-app/**']
  }
})
