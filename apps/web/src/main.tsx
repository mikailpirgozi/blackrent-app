import React from 'react';
import ReactDOM from 'react-dom/client';

import App from './App';
import './index.css';
import { logger } from './utils/logger';

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);

root.render(
  // ⚡ PERFORMANCE: StrictMode re-enabled for production quality
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// Error handling pre manifest.json
window.addEventListener('error', event => {
  if (event.filename && event.filename.includes('manifest.json')) {
    logger.debug('⚠️ Ignoring manifest.json error - this is expected');
    event.preventDefault();
  }
});

// ⚡ PERFORMANCE: Initialize Web Vitals monitoring (development + production)
import('./utils/webVitals').then(({ reportWebVitals }) => {
  reportWebVitals(data => {
    // Production: Send to analytics endpoint (if configured)
    if (import.meta.env.PROD && import.meta.env.VITE_ANALYTICS_ENDPOINT) {
      fetch(import.meta.env.VITE_ANALYTICS_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      }).catch(() => {
        // Silently fail in production
      });
    }
    
    // Development: Log to console
    if (import.meta.env.DEV) {
      logger.debug('📊 Web Vitals:', data);
    }
  });
});
