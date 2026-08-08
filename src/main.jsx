import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import './utils/notifications';
import { initAppAppearance } from './mobile/mmfPreferences';
import App from './App';

initAppAppearance();

window.addEventListener('error', (event) => {
  console.error('[Global error]', event.error || event.message);
});

window.addEventListener('unhandledrejection', (event) => {
  console.error('[Unhandled promise rejection]', event.reason);
});

// Clear broken PWA caches from earlier mobile testing (dev recovery)
if (typeof navigator !== 'undefined' && 'serviceWorker' in navigator && import.meta.env.DEV) {
  navigator.serviceWorker.getRegistrations().then((regs) => {
    regs.forEach((reg) => reg.unregister());
  });
  if (window.caches?.keys) {
    caches.keys().then((keys) => keys.forEach((k) => caches.delete(k)));
  }
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
