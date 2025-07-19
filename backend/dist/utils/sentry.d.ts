import { Express } from "express";
export declare const initSentry: (app: Express) => {
    requestHandler: any;
    tracingHandler: any;
    errorHandler: any;
} | null;
export declare const reportError: (error: Error, context?: Record<string, any>) => void;
export declare const reportMessage: (message: string, level?: "info" | "warning" | "error") => void;
//# sourceMappingURL=sentry.d.ts.map