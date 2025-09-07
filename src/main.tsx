import ReactDOM from 'react-dom/client';

import App from './App';
import './index.css';
import { logger } from './utils/logger';

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);

root.render(
  // Dočasne vypnutý StrictMode pre auth debugging
  // <React.StrictMode>
  <App />
  // </React.StrictMode>
);

// Error handling pre manifest.json
window.addEventListener('error', event => {
  if (event.filename && event.filename.includes('manifest.json')) {
    logger.debug('⚠️ Ignoring manifest.json error - this is expected');
    event.preventDefault();
  }
});

// Initialize performance monitoring
if (import.meta.env.MODE === 'development') {
  import('./utils/webVitals').then(({ reportWebVitals }) => {
    reportWebVitals(); // Silent monitoring
  });
}
