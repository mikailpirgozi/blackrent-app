/**
 * 🚀 CENTRÁLNY LOGGER SYSTÉM PRE BACKEND
 *
 * Umožňuje kontrolovať úroveň logovania podľa prostredia
 * - Development: Všetky logy
 * - Production: Len dôležité logy
 */
export declare const logger: {
    debug: (...args: any[]) => void;
    info: (...args: any[]) => void;
    warn: (...args: any[]) => void;
    error: (...args: any[]) => void;
    perf: (...args: any[]) => void;
    auth: (...args: any[]) => void;
    db: (...args: any[]) => void;
    migration: (...args: any[]) => void;
};
export default logger;
//# sourceMappingURL=logger.d.ts.map