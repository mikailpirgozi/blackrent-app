/**
 * Production-Safe Logger
 * Prevents Railway log spam by disabling debug logs in production
 */

const isProduction = process.env.NODE_ENV === 'production';
const isDevelopment = process.env.NODE_ENV === 'development';

export const logger = {
  // 🐛 Debug - LEN v development
  debug: (...args: any[]) => {
    if (isDevelopment) {
      console.log(...args);
    }
  },

  // ℹ️ Info - Dôležité info v oboch environments
  info: (...args: any[]) => {
    console.log(...args);
  },

  // ⚠️ Warning - Vždy
  warn: (...args: any[]) => {
    console.warn(...args);
  },

  // ❌ Error - Vždy
  error: (...args: any[]) => {
    console.error(...args);
  },

  // 🔐 Auth - LEN v development
  auth: (...args: any[]) => {
    if (isDevelopment) {
      console.log(...args);
    }
  },

  // 🗄️ Cache - LEN v development
  cache: (...args: any[]) => {
    if (isDevelopment) {
      console.log(...args);
    }
  },

  // 📋 Migration - Vždy (dôležité)
  migration: (...args: any[]) => {
    console.log(...args);
  },

  // 🚀 Startup - Vždy
  startup: (...args: any[]) => {
    console.log(...args);
  },

  // 🗄️ Database - LEN v development
  db: (...args: any[]) => {
    if (isDevelopment) {
      console.log(...args);
    }
  },
};

// Backward compatibility - callable log function
export const log = (level: string, ...args: any[]) => {
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
