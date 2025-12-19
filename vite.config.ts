import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['vite.svg', 'zigmage.wasm'],
      manifest: {
        name: 'Zigmage',
        short_name: 'Zigmage',
        description: 'Professional Image Editing, Reimagined for Web.',
        theme_color: '#000000',
        background_color: '#000000',
        display: 'minimal-ui',
        start_url: '/editor',
        icons: [
          {
            src: 'vite.svg',
            sizes: '192x192',
            type: 'image/svg+xml'
          },
          {
            src: 'vite.svg',
            sizes: '512x512',
            type: 'image/svg+xml'
          }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,wasm}']
      },
      devOptions: {
        enabled: true,
        type: 'module',
      }
    })
  ],

  // use polling
  server: {
    watch: {
      usePolling: true,
    }
  },
})
