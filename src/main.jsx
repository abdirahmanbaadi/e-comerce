import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import './utils/notifications';
import App from './App';

window.addEventListener('error', (event) => {
  console.error('[Global error]', event.error || event.message);
});

window.addEventListener('unhandledrejection', (event) => {
  console.error('[Unhandled promise rejection]', event.reason);
});

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
