// Jednoduchá Sentry integrácia pre Railway backend
import { Express } from "express";

// Conditional import pre Sentry - len ak je DSN nastavený
let Sentry: any = null;

export const initSentry = (app: Express) => {
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
      
      beforeSend(event: any) {
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
        shouldHandleError(error: any) {
          return error.status === undefined || error.status >= 400;
        },
      }),
    };
    
  } catch (error) {
    console.warn('⚠️ Sentry initialization failed:', error);
    return null;
  }
};

// Utility funkcie
export const reportError = (error: Error, context?: Record<string, any>) => {
  if (!Sentry) return;
  
  try {
    Sentry.withScope((scope: any) => {
      if (context) {
        Object.keys(context).forEach(key => {
          scope.setTag(key, context[key]);
        });
      }
      Sentry.captureException(error);
    });
  } catch (err) {
    console.warn('Sentry reportError failed:', err);
  }
};

export const reportMessage = (message: string, level: 'info' | 'warning' | 'error' = 'info') => {
  if (!Sentry) return;
  
  try {
    Sentry.captureMessage(message, level);
  } catch (err) {
    console.warn('Sentry reportMessage failed:', err);
  }
}; 