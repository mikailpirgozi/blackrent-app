"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.reportMessage = exports.reportError = exports.initSentry = void 0;
// Conditional import pre Sentry - len ak je DSN nastavený
let Sentry = null;
const initSentry = (app) => {
    const dsn = process.env.SENTRY_DSN_BACKEND;
    if (!dsn) {
        console.warn('🚨 SENTRY_DSN_BACKEND nie je nastavený - Sentry error tracking vypnutý');
        return null;
    }
    try {
        // Dynamický import Sentry modulov
        Sentry = require('@sentry/node');
        Sentry.init({
            dsn: dsn,
            environment: process.env.NODE_ENV || 'development',
            tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
            release: process.env.VERSION || 'unknown',
            integrations: [
                new Sentry.Integrations.Http({ tracing: true }),
                new Sentry.Integrations.Express({ app }),
            ],
            beforeSend(event) {
                if (process.env.NODE_ENV === 'development') {
                    console.log('🐛 Sentry backend event (dev):', event.exception?.values?.[0]?.value);
                    return null;
                }
                if (event.request?.url?.includes('/health')) {
                    return null;
                }
                return event;
            },
        });
        console.log('✅ Sentry backend inicializovaný:', dsn.substring(0, 20) + '...');
        return {
            requestHandler: Sentry.Handlers.requestHandler(),
            tracingHandler: Sentry.Handlers.tracingHandler(),
            errorHandler: Sentry.Handlers.errorHandler({
                shouldHandleError(error) {
                    return error.status === undefined || error.status >= 400;
                },
            }),
        };
    }
    catch (error) {
        console.warn('⚠️ Sentry initialization failed:', error);
        return null;
    }
};
exports.initSentry = initSentry;
// Utility funkcie
const reportError = (error, context) => {
    if (!Sentry)
        return;
    try {
        Sentry.withScope((scope) => {
            if (context) {
                Object.keys(context).forEach(key => {
                    scope.setTag(key, context[key]);
                });
            }
            Sentry.captureException(error);
        });
    }
    catch (err) {
        console.warn('Sentry reportError failed:', err);
    }
};
exports.reportError = reportError;
const reportMessage = (message, level = 'info') => {
    if (!Sentry)
        return;
    try {
        Sentry.captureMessage(message, level);
    }
    catch (err) {
        console.warn('Sentry reportMessage failed:', err);
    }
};
exports.reportMessage = reportMessage;
//# sourceMappingURL=sentry.js.map