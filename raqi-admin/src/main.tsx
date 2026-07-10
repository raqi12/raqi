import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { App } from './App';
import './styles.css';

const storedTheme = localStorage.getItem('raqi_admin_theme');
document.documentElement.setAttribute(
  'data-theme',
  storedTheme === 'light' || storedTheme === 'dark' ? storedTheme : 'dark',
);

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>,
);
