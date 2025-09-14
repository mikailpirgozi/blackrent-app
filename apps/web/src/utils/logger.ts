/**
 * 🚀 CENTRÁLNY LOGGER SYSTÉM
 *
 * Umožňuje kontrolovať úroveň logovania podľa prostredia
 * - Development: Všetky logy
 * - Production: Len dôležité logy
 */

const isDevelopment = process.env.NODE_ENV === 'development';

export const logger = {
  // 🐛 Debug logy - len v development
  debug: (...args: unknown[]) => {
    if (isDevelopment) {
       
      console.log(...args);
    }
  },

  // ℹ️ Info logy - vždy
  info: (...args: unknown[]) => {
     
    console.log(...args);
  },

  // ⚠️ Warning logy - vždy
  warn: (...args: unknown[]) => {
     
    console.warn(...args);
  },

  // 🚨 Error logy - vždy
  error: (...args: unknown[]) => {
     
    console.error(...args);
  },

  // 📊 Performance logy - vždy (dôležité pre monitoring)
  perf: (...args: unknown[]) => {
     
    console.log(...args);
  },

  // 🔐 Auth logy - vždy (dôležité pre security debugging)
  auth: (...args: unknown[]) => {
     
    console.log(...args);
  },
};

export default logger;
