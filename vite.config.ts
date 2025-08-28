import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'
import removeConsole from 'vite-plugin-remove-console'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    // Remove console.log in production
    removeConsole()
  ],
  
  // Define global variables
  define: {
    global: 'globalThis',
    'process.env': {},
  },
  
  // Resolve aliases pre kompatibilitu s existujúcimi importmi
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
    },
  },

  // Server konfigurácia
  server: {
    port: 3000,
    open: true,
    host: true,
    // Cache nastavenia pre stabilitu
    hmr: {
      overlay: false, // Vypne error overlay ktorý môže spôsobiť problémy
    },
    // Force reload pri zmenách v kritických súboroch
    watch: {
      usePolling: true,
      interval: 1000,
    },
  },

  // Build konfigurácia
  build: {
    outDir: 'dist',
    sourcemap: false,
    rollupOptions: {
      output: {
        // 🛡️ NUCLEAR OPTION: NO chunking at all - everything in main bundle
        // This is the ONLY reliable solution for MUI getContrastRatio issues
        manualChunks: undefined,
      },

    },
  },

  // Environment variables prefix
  envPrefix: ['VITE_', 'REACT_APP_'],

  // CSS konfigurácia
  css: {
    devSourcemap: true,
  },

  // Optimalizácia závislostí
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      '@mui/material',
      '@mui/icons-material',
      '@mui/x-date-pickers',
      'react-router-dom',
      'date-fns',
      'dayjs',
      'axios',
    ],
    // Force pre-bundling of these dependencies
    force: true,
  },

  // Cache konfigurácia pre stabilitu
  cacheDir: 'node_modules/.vite',

  // Test konfigurácia pre Vitest
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/setupTests.ts'],
    css: true,
    exclude: [
      '**/node_modules/**',
      '**/dist/**',
      '**/customer-website/**',
      '**/Figma-Context-MCP/**',
      '**/.{idea,git,cache,output,temp}/**',
    ],
  },
})
