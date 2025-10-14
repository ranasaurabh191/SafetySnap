console.log('🌍 Environment Mode:', import.meta.env.MODE);
console.log('🔗 API Base URL:', import.meta.env.VITE_API_BASE_URL);
console.log('📦 All Env Vars:', import.meta.env);

import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
