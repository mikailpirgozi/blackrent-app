/**
 * Production-Safe Logger
 * Prevents Railway log spam by disabling debug logs in production
 */

const isProduction = process.env.NODE_ENV === 'production';
const isDevelopment = process.env.NODE_ENV === 'development';

export const logger = {
  // 🐛 Debug - LEN v development
  debug: (...args: unknown[]) => {
    if (isDevelopment) {
      console.log(...args);
    }
  },

  // ℹ️ Info - Dôležité info v oboch environments
  info: (...args: unknown[]) => {
    console.log(...args);
  },

  // ⚠️ Warning - Vždy
  warn: (...args: unknown[]) => {
    console.warn(...args);
  },

  // ❌ Error - Vždy
  error: (...args: unknown[]) => {
    console.error(...args);
  },

  // 🔐 Auth - LEN v development
  auth: (...args: unknown[]) => {
    if (isDevelopment) {
      console.log(...args);
    }
  },

  // 🗄️ Cache - LEN v development
  cache: (...args: unknown[]) => {
    if (isDevelopment) {
      console.log(...args);
    }
  },

  // 📋 Migration - Vždy (dôležité)
  migration: (...args: unknown[]) => {
    console.log(...args);
  },

  // 🚀 Startup - Vždy
  startup: (...args: unknown[]) => {
    console.log(...args);
  },

  // 🗄️ Database - LEN v development
  db: (...args: unknown[]) => {
    if (isDevelopment) {
      console.log(...args);
    }
  },
};

// Backward compatibility - callable log function
export const log = (level: string, ...args: unknown[]) => {
  if (level === 'error') {
    logger.error(...args);
  } else if (level === 'warn') {
    logger.warn(...args);
  } else if (level === 'info') {
    logger.info(...args);
  } else {
    logger.debug(...args);
  }
};

export default logger;
