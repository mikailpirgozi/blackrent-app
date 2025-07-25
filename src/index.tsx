import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import { initSentry } from './utils/sentry';

// Inicializuj Sentry ako prvé
initSentry();

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

// Performance monitoring disabled - reportWebVitals removed
