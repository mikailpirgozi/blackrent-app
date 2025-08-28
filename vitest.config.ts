import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    env: {
      VITE_API_URL: 'http://localhost:3001/api',
    },
    exclude: [
      '**/node_modules/**',
      '**/customer-website/**',  // Ignoruj customer-website testy
      '**/Figma-Context-MCP/**', // Ignoruj MCP testy
      '**/build/**',
      '**/dist/**'
    ],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})