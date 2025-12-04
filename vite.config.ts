import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import path from 'path'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      devOptions: {
        enabled: true
      },
      manifest: {
        name: 'LRMC Staff Attendance System',
        short_name: 'LRMC Staff',
        description: 'Geo-fence based attendance management system for LRMC employees',
        theme_color: '#ea580c',
        background_color: '#0f172a',
        display: 'standalone',
        icons: [
          {
            src: 'public/logo192.png',
            sizes: '192x192',
            type: 'image/png'
          }
        ],
        start_url: '/',
        scope: '/',
        orientation: 'portrait',
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
        navigateFallback: '/index.html',
        cleanupOutdatedCaches: true,
        // Exclude dynamic APIs from caching
        runtimeCaching: [
          {
            urlPattern: /^http.*\/api\/attendance\/today/,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'attendance-today',
              networkTimeoutSeconds: 10,
              expiration: {
                maxEntries: 1,
                maxAgeSeconds: 30, // 30 seconds
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
          {
            urlPattern: /^http.*\/api\/attendance\/me/,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'attendance-me',
              networkTimeoutSeconds: 10,
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 30, // 30 seconds
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
          {
            urlPattern: /^http.*\/api\/attendance\/checkin/,
            handler: 'NetworkOnly',
          },
          {
            urlPattern: /^http.*\/api\/attendance\/checkout/,
            handler: 'NetworkOnly',
          },
        ],
      },
      injectRegister: 'auto',
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'masked-icon.svg'],
    })
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    host: true, // This allows external connections
    port: 5173,
  }
})