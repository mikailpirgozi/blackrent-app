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
  debug: (...args: any[]) => {
    if (isDevelopment) {
      console.log(...args);
    }
  },
  
  // ℹ️ Info logy - vždy
  info: (...args: any[]) => {
    console.log(...args);
  },
  
  // ⚠️ Warning logy - vždy  
  warn: (...args: any[]) => {
    console.warn(...args);
  },
  
  // 🚨 Error logy - vždy
  error: (...args: any[]) => {
    console.error(...args);
  },
  
  // 📊 Performance logy - vždy (dôležité pre monitoring)
  perf: (...args: any[]) => {
    console.log(...args);
  },
  
  // 🔐 Auth logy - vždy (dôležité pre security debugging)
  auth: (...args: any[]) => {
    console.log(...args);
  }
};

export default logger;