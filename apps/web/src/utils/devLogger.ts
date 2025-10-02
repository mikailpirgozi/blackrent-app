// src/utils/devLogger.ts
// Smart logger pre development optimalizáciu

export const devLogger = {
  // Len kritické logy v dev mode
  debug: process.env.NODE_ENV === 'development' && import.meta.env.VITE_DEBUG === 'true' 
    ? console.log 
    : () => {},
  
  info: console.info,
  warn: console.warn,
  error: console.error,
  
  // HMR specific logging
  hmr: process.env.NODE_ENV === 'development' 
    ? (message: string) => console.log(`🔄 HMR: ${message}`)
    : () => {},

  // PWA specific logging (reduced verbosity)
  pwa: process.env.NODE_ENV === 'development' 
    ? (message: string) => console.log(`📱 PWA: ${message}`)
    : () => {},

  // Service Worker logging
  sw: process.env.NODE_ENV === 'development' 
    ? (message: string) => console.log(`🔧 SW: ${message}`)
    : () => {},

  // React Query logging
  query: process.env.NODE_ENV === 'development' 
    ? (message: string) => console.log(`🔄 Query: ${message}`)
    : () => {},

  // Performance logging
  perf: process.env.NODE_ENV === 'development' 
    ? (message: string) => console.log(`⚡ Perf: ${message}`)
    : () => {}
};

// Export pre backward compatibility
export default devLogger;
