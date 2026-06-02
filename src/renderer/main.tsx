import React from 'react';
import ReactDOM from 'react-dom/client';
import './prop-types-bundle'; // Ensure prop-types is bundled for plotly.js
import App from './App';
import './styles/global.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
