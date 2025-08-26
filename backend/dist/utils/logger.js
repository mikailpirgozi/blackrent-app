"use strict";
/**
 * 🚀 CENTRÁLNY LOGGER SYSTÉM PRE BACKEND
 *
 * Umožňuje kontrolovať úroveň logovania podľa prostredia
 * - Development: Všetky logy
 * - Production: Len dôležité logy
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.logger = void 0;
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
    }
};
exports.default = exports.logger;
//# sourceMappingURL=logger.js.map