// Environment variables helper for Vite
export const env = {
  API_URL: import.meta.env.VITE_API_URL,
  NODE_ENV: import.meta.env.MODE,
} as const

// Backward compatibility helper
export const getApiUrl = (): string => {
  return env.API_URL || 'http://localhost:3001/api'
}

// Type-safe environment access
export const isDevelopment = env.NODE_ENV === 'development'
export const isProduction = env.NODE_ENV === 'production'
export const isTest = env.NODE_ENV === 'test'