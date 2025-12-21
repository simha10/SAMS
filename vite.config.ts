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
        enabled: false, // Disable service worker in development
        type: 'module',
        suppressWarnings: true,
        navigateFallback: undefined // Disable navigate fallback in development
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
        // More aggressive cache busting
        clientsClaim: false, // Don't claim clients immediately
        skipWaiting: false, // Don't skip waiting
        // Exclude dynamic APIs from caching
        // Disable runtime caching in development to prevent double refresh
        runtimeCaching: process.env.NODE_ENV === 'development' ? [] : [
          {
            urlPattern: /^http.*\/api\/auth\/.*$/,
            handler: 'NetworkOnly', // Never cache auth endpoints
            options: {
              cacheName: 'auth-endpoints',
            },
          },
          {
            urlPattern: /^http.*\/api\/attendance\/today/,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'attendance-today',
              networkTimeoutSeconds: 5,
              expiration: {
                maxEntries: 1,
                maxAgeSeconds: 10, // 10 seconds
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
              networkTimeoutSeconds: 5,
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 10, // 10 seconds
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
          {
            urlPattern: /^http.*\/api\/attendance\/checkin/,
            handler: 'NetworkOnly',
            options: {
              cacheName: 'attendance-checkin',
            },
          },
          {
            urlPattern: /^http.*\/api\/attendance\/checkout/,
            handler: 'NetworkOnly',
            options: {
              cacheName: 'attendance-checkout',
            },
          },
          {
            urlPattern: /^http.*\/api\/.*$/,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-responses',
              networkTimeoutSeconds: 5,
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 30, // 30 seconds
              },
            },
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
    host: '0.0.0.0', // Allow connections from any IP address
    port: 5173,
    strictPort: false, // Allow fallback to another port if 5173 is busy
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