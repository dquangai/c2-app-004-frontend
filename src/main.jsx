import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import { applyDocumentLocale, getStoredLocale } from './i18n/translate';
import './index.css';

applyDocumentLocale(getStoredLocale());

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
