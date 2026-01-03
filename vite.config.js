import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import fs from 'fs'
import path from 'path'

// https://vite.dev/config/
import packageJson from './package.json';

// Timestamp único do build - muda a cada deploy automaticamente
const BUILD_TIME = new Date().toISOString();

// Plugin para gerar version.json automaticamente no build
const versionPlugin = () => ({
  name: 'version-plugin',
  buildStart() {
    const versionInfo = {
      version: packageJson.version,
      buildTime: BUILD_TIME
    };
    fs.writeFileSync(
      path.resolve(__dirname, 'public/version.json'),
      JSON.stringify(versionInfo, null, 2)
    );
    console.log(`✅ version.json gerado: v${packageJson.version} (build: ${BUILD_TIME})`);
  }
});

export default defineConfig({
  define: {
    '__APP_VERSION__': JSON.stringify(packageJson.version),
    '__BUILD_TIME__': JSON.stringify(BUILD_TIME)
  },

  plugins: [
    react(),
    versionPlugin(),

    // VitePWA({
    //   registerType: 'autoUpdate',
    //   workbox: {
    //     cleanupOutdatedCaches: true,
    //     clientsClaim: true,
    //     skipWaiting: true
    //   },
    //   includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'masked-icon.svg'],
    //   manifest: {
    //     name: 'SiG Remédios',
    //     short_name: 'SiG',
    //     description: 'Gerenciamento inteligente de medicamentos e saúde familiar.',
    //     theme_color: '#0f766e',
    //     background_color: '#ffffff',
    //     display: 'standalone',
    //     orientation: 'portrait',
    //     icons: [
    //       {
    //         src: 'pwa-192x192.png',
    //         sizes: '192x192',
    //         type: 'image/png'
    //       },
    //       {
    //         src: 'pwa-512x512.png',
    //         sizes: '512x512',
    //         type: 'image/png'
    //       }
    //     ]
    //   }
    // })
  ],
  server: {
    port: 3000,
    strictPort: true,  // Sempre usa porta 3000, nunca muda
    host: true,

    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
        secure: false,
      }
    }
  },
  build: {
    chunkSizeWarningLimit: 1000,
    // NOTE: terser pure_funcs was removed because it was causing runtime errors
    // Console.log removal is NOT worth breaking the app
    // If needed, use conditional logging in the code instead
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-router-dom'],
          supabase: ['@supabase/supabase-js'],
          ui: ['lucide-react', 'clsx', 'date-fns'],
          utils: ['canvas-confetti', 'html2canvas', 'jspdf']
        }
      }
    }
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/setupTests.js',
    css: true,
    exclude: [
      '**/node_modules/**',
      '**/dist/**',
      '**/backup_*/**',
      '**/backups/**'
    ]
  }
})
// Trigger reload
