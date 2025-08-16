import React from 'react';
import { useLocation, useNavigationType, createRoutesFromChildren, matchRoutes } from 'react-router-dom';
import * as Sentry from "@sentry/react";
import { browserTracingIntegration, replayIntegration } from "@sentry/react";

// Sentry konfigurácia pre BlackRent frontend
export const initSentry = () => {
  // Inicializuj Sentry len ak je DSN nastavený
  const dsn = process.env.REACT_APP_SENTRY_DSN;
  
  if (!dsn) {
    console.warn('🚨 REACT_APP_SENTRY_DSN nie je nastavený - Sentry error tracking vypnutý');
    return;
  }

  Sentry.init({
    dsn: dsn,
    environment: process.env.NODE_ENV || 'development',
    
    // Performance monitoring
    tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
    
    // Session replay (voliteľné)
    replaysSessionSampleRate: 0.1, // 10% sessions
    replaysOnErrorSampleRate: 1.0, // 100% error sessions
    
    // Release tracking
    release: process.env.REACT_APP_VERSION || 'unknown',
    
    // Integrácie
    integrations: [
      browserTracingIntegration(),
      replayIntegration({
        // Replay len pre error sessions na produkcii
        maskAllText: true,
        blockAllMedia: true,
      }),
    ],
    
    // Filter out známe chyby
    beforeSend(event: Sentry.ErrorEvent) {
      // Ignoruj development errors
      if (process.env.NODE_ENV === 'development') {
        console.log('🐛 Sentry event (dev):', event);
        return null; // Nepošli na Sentry v dev mode
      }
      
      // Ignoruj network errors (nie sú to app bugs)
      if (event.exception?.values?.[0]?.type === 'ChunkLoadError') {
        return null;
      }
      
      if (event.exception?.values?.[0]?.value?.includes('Loading chunk')) {
        return null;
      }
      
      return event;
    },
    
    // Custom tagy
    initialScope: {
      tags: {
        component: 'frontend',
        framework: 'react',
        project: 'blackrent'
      },
    },
  });
  
  // Nastavenie user context (ak je prihlásený)
  const user = localStorage.getItem('blackrent_user');
  if (user) {
    try {
      const userData = JSON.parse(user);
      Sentry.setUser({
        id: userData.id?.toString(),
        username: userData.username,
        email: userData.email,
      });
    } catch (e) {
      // Ignore parsing errors
    }
  }
  
  console.log('✅ Sentry frontend inicializovaný:', dsn.substring(0, 20) + '...');
};

// Error boundary wrapper
export const SentryErrorBoundary = Sentry.withErrorBoundary;

// Manual error reporting
export const reportError = (error: Error, context?: Record<string, any>) => {
  Sentry.withScope((scope: Sentry.Scope) => {
    if (context) {
      scope.setContext('additional_info', context);
    }
    Sentry.captureException(error);
  });
};

// Manual message reporting
export const reportMessage = (message: string, level: 'info' | 'warning' | 'error' = 'info') => {
  Sentry.captureMessage(message, level);
};

// Performance tracing
export const startTransaction = (name: string, op: string) => {
  return Sentry.startSpan({ name, op }, () => {});
}; 