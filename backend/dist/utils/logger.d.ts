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
export declare function log(level: LogLevel, ctx: LogContext, msg: string, extra?: any): void;
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