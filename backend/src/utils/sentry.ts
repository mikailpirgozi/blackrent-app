import * as Sentry from "@sentry/node";
import { Express } from "express";

// Sentry konfigurácia pre BlackRent backend
export const initSentry = (app: Express) => {
  // Inicializuj Sentry len ak je DSN nastavený
  const dsn = process.env.SENTRY_DSN_BACKEND || process.env.SENTRY_DSN;
  
  if (!dsn) {
    console.warn('🚨 SENTRY_DSN_BACKEND nie je nastavený - Sentry error tracking vypnutý');
    return;
  }

  Sentry.init({
    dsn: dsn,
    environment: process.env.NODE_ENV || 'development',
    
    // Performance monitoring
    tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
    
    // Release tracking
    release: process.env.VERSION || 'unknown',
    
    // Integrácie
    integrations: [
      // Express.js tracing
      new Sentry.Integrations.Http({ tracing: true }),
      new Sentry.Integrations.Express({ app }),
    ],
    
    // Filter out známe chyby
    beforeSend(event: any) {
      // Ignoruj development errors
      if (process.env.NODE_ENV === 'development') {
        console.log('🐛 Sentry backend event (dev):', event.exception?.values?.[0]?.value);
        return null; // Nepošli na Sentry v dev mode
      }
      
      // Ignoruj health check errors
      if (event.request?.url?.includes('/health')) {
        return null;
      }
      
      // Ignoruj PostgreSQL connection test errors
      if (event.exception?.values?.[0]?.value?.includes('connect ECONNREFUSED')) {
        return null;
      }
      
      return event;
    },
    
    // Custom tagy
    initialScope: {
      tags: {
        component: 'backend',
        framework: 'express',
        database: 'postgresql',
        project: 'blackrent'
      },
    },
  });
  
  console.log('✅ Sentry backend inicializovaný:', dsn.substring(0, 20) + '...');
  
  return {
    // Request handler - musí byť prvý middleware
    requestHandler: Sentry.Handlers.requestHandler(),
    
    // Tracing handler
    tracingHandler: Sentry.Handlers.tracingHandler(),
    
    // Error handler - musí byť posledný middleware
    errorHandler: Sentry.Handlers.errorHandler({
      shouldHandleError(error: any) {
        // Pošli len 4xx a 5xx chyby na Sentry
        return error.status === undefined || error.status >= 400;
      },
    }),
  };
};

// Manual error reporting
export const reportError = (error: Error, context?: Record<string, any>) => {
  Sentry.withScope((scope: any) => {
    if (context) {
      Object.keys(context).forEach(key => {
        scope.setTag(key, context[key]);
      });
    }
    Sentry.captureException(error);
  });
};

// Manual message reporting
export const reportMessage = (message: string, level: 'info' | 'warning' | 'error' = 'info') => {
  Sentry.captureMessage(message, level);
};

// Set user context
export const setSentryUser = (userId: string, username?: string, email?: string) => {
  Sentry.setUser({
    id: userId,
    username: username,
    email: email,
  });
};

// Performance tracing
export const startTransaction = (name: string, op: string) => {
  return Sentry.startTransaction({ name, op });
}; 