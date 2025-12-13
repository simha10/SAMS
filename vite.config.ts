import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import path from 'path'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  // Base path for production - important for SPA routing
  base: '/',
  
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
    host: '127.0.0.1', // Restrict to localhost only to mitigate esbuild vulnerability
    port: 5173,
  },
  build: {
    // Generate manifest for better asset management
    manifest: true,
    // Ensure relative paths are used
    rollupOptions: {
      output: {
        assetFileNames: (assetInfo) => {
          if (!assetInfo.name) {
            return 'assets/[name]-[hash][extname]';
          }
          let extType = assetInfo.name.split('.').pop();
          if (extType && /png|jpe?g|svg|gif|tiff|bmp|ico/i.test(extType)) {
            extType = 'img';
          } else if (extType && /woff|woff2/.test(extType)) {
            extType = 'fonts';
          }
          return `assets/${extType}/[name]-[hash][extname]`;
        },
        chunkFileNames: 'assets/js/[name]-[hash].js',
        entryFileNames: 'assets/js/[name]-[hash].js',
      },
    },
  },
})