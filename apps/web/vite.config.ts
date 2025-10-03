import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import svgr from 'vite-plugin-svgr';
import path from 'path';
import { visualizer } from 'rollup-plugin-visualizer';

export default defineConfig({
  plugins: [
    react(),
    svgr({
      svgrOptions: {
        icon: true,
      },
      include: '**/*.svg?react',
    }),
    // 📊 Bundle Analyzer - generuje stats.html po build
    visualizer({
      filename: './dist/stats.html',
      open: false, // Automaticky neotvorí browser
      gzipSize: true,
      brotliSize: true,
      template: 'treemap', // 'treemap', 'sunburst', 'network'
    }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 3000,
    // OPTIMALIZÁCIA FILE WATCHING - Native file watching (rýchlejšie než polling)
    watch: {
      usePolling: false, // ✅ Native file watching - 70% CPU saving
      ignored: ['**/node_modules/**', '**/.git/**', '**/build/**'],
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
        timeout: 30000, // 30 sekúnd timeout
        // ✅ CRITICAL FIX: Disable proxy cache pre fresh data
        configure: (proxy, _options) => {
          proxy.on('proxyReq', (proxyReq, _req, _res) => {
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
