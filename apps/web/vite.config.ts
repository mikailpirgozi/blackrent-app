import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import svgr from 'vite-plugin-svgr';
import path from 'path';

export default defineConfig({
  plugins: [
    react(),
    svgr({
      svgrOptions: {
        icon: true,
      },
      include: '**/*.svg?react',
    }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 3000,
    // OPTIMALIZÁCIA FILE WATCHING
    watch: {
      usePolling: true,
      interval: 100, // Rýchlejšie než default 200ms
      ignored: ['**/node_modules/**', '**/.git/**'],
    },
    // SEPARÁTNY HMR PORT
    hmr: {
      overlay: true,
      port: 3003,
      host: 'localhost',
    },
    // PROXY OPTIMALIZÁCIA
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
        secure: false,
        timeout: 5000, // Rýchlejší timeout
        // ✅ CRITICAL FIX: Disable proxy cache pre fresh data
        configure: (proxy, _options) => {
          proxy.on('proxyReq', (proxyReq, req, _res) => {
            // Add cache-busting headers
            proxyReq.setHeader(
              'Cache-Control',
              'no-cache, no-store, must-revalidate'
            );
            proxyReq.setHeader('Pragma', 'no-cache');
            proxyReq.setHeader('Expires', '0');
          });
        },
      },
    },
  },
  build: {
    outDir: 'build',
    sourcemap: process.env.NODE_ENV === 'development',
    minify: 'esbuild',
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          query: ['@tanstack/react-query', '@tanstack/react-query-devtools'],
          pdf: ['jspdf'],
          utils: ['date-fns', 'uuid'],
          charts: ['recharts'],
          socket: ['socket.io-client'],
        },
      },
    },
    chunkSizeWarningLimit: 1000,
  },
  // DEV FLAGS
  define: {
    global: 'globalThis',
    __DEV_DISABLE_SW_CACHE__: JSON.stringify(
      process.env.NODE_ENV === 'development'
    ),
    __DEV_FAST_REFRESH__: JSON.stringify(
      process.env.NODE_ENV === 'development'
    ),
  },
});
