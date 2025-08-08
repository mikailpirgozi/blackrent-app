import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
// Sentry removed - using MobileLogger instead

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);

root.render(
  // 🚀 DOČASNE VYPNUTÝ StrictMode pre auth debugging
  // <React.StrictMode>
    <App />
  // </React.StrictMode>
);

// Error handling pre manifest.json
window.addEventListener('error', (event) => {
  if (event.filename && event.filename.includes('manifest.json')) {
    console.log('⚠️ Ignoring manifest.json error - this is expected');
    event.preventDefault();
  }
});

// Initialize error handling for manifest.json and performance monitoring
if (process.env.NODE_ENV === 'development') {
  import('./utils/webVitals').then(({ debugPerformance, reportWebVitals }) => {
    debugPerformance();
    
    // Initialize Web Vitals monitoring
    reportWebVitals((data) => {
      console.log('📊 Web Vitals:', data);
    });
  });
}
