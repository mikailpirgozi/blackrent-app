import React from 'react';
import ReactDOM from 'react-dom/client';

import App from './App';
import './index.css';
import { logger } from '@/utils/smartLogger';
// Sentry removed - using MobileLogger instead

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);

root.render(
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

// Initialize error handling for manifest.json and performance monitoring
if (process.env.NODE_ENV === 'development') {
  // ⚡ PERFORMANCE: Disabled verbose Web Vitals logging to reduce console spam
  import('./utils/webVitals').then(({ reportWebVitals }) => {
    // debugPerformance(); // Disabled - too verbose

    // Initialize Web Vitals monitoring (silent mode)
    reportWebVitals(); // No callback = silent monitoring
  });
}
