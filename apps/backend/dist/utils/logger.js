"use strict";
/**
 * 🚀 STRUCTURED LOGGER SYSTÉM PRE BACKEND
 *
 * Poskytuje jednotné JSON logovanie s requestId a kontextom
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.logger = void 0;
exports.log = log;
/**
 * Structured logger helper - všetky logy vo formáte JSON
 * @param level - úroveň logovania (info, warn, error, debug)
 * @param ctx - kontext objektu s requestId a ďalšími údajmi
 * @param msg - hlavná správa
 * @param extra - dodatočné údaje
 */
function log(level, ctx, msg, extra) {
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
exports.logger = {
    // 🐛 Debug logy - len v development
    debug: (...args) => {
        if (isDevelopment) {
            console.log(...args);
        }
    },
    // ℹ️ Info logy - vždy
    info: (...args) => {
        console.log(...args);
    },
    // ⚠️ Warning logy - vždy
    warn: (...args) => {
        console.warn(...args);
    },
    // 🚨 Error logy - vždy
    error: (...args) => {
        console.error(...args);
    },
    // 📊 Performance logy - vždy (dôležité pre monitoring)
    perf: (...args) => {
        console.log(...args);
    },
    // 🔐 Auth logy - vždy (dôležité pre security debugging)
    auth: (...args) => {
        console.log(...args);
    },
    // 🗄️ Database logy - len v development
    db: (...args) => {
        if (isDevelopment) {
            console.log(...args);
        }
    },
    // 🔄 Migration logy - vždy (dôležité pre deployment)
    migration: (...args) => {
        console.log(...args);
    },
};
exports.default = exports.logger;
//# sourceMappingURL=logger.js.map