/**
 * 🚀 STRUCTURED LOGGER SYSTÉM PRE BACKEND
 *
 * Poskytuje jednotné JSON logovanie s requestId a kontextom
 */

type LogLevel = 'info' | 'warn' | 'error';

interface LogContext extends Record<string, any> {
  requestId?: string;
}

/**
 * Structured logger helper - všetky logy vo formáte JSON
 * @param level - úroveň logovania (info, warn, error, debug)
 * @param ctx - kontext objektu s requestId a ďalšími údajmi
 * @param msg - hlavná správa
 * @param extra - dodatočné údaje
 */
export function log(
  level: LogLevel,
  ctx: LogContext,
  msg: string,
  extra?: any
): void {
  const timestamp = new Date().toISOString();

  const logEntry = {
    ts: timestamp,
    level,
    requestId: ctx.requestId || 'no-request-id',
    ...ctx,
    msg,
    ...(extra && { extra }),
  };

  // Výstup podľa úrovne
  switch (level) {
    case 'error':
      console.error(JSON.stringify(logEntry));
      break;
    case 'warn':
      console.warn(JSON.stringify(logEntry));
      break;

    case 'info':
    default:
      console.log(JSON.stringify(logEntry));
      break;
  }
}

// Backward compatibility - zachovaj pôvodný logger pre existujúci kód
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
  },

  // 🗄️ Database logy - len v development
  db: (...args: any[]) => {
    if (isDevelopment) {
      console.log(...args);
    }
  },

  // 🔄 Migration logy - vždy (dôležité pre deployment)
  migration: (...args: any[]) => {
    console.log(...args);
  },
};

export default logger;
