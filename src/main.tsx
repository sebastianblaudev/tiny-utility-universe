
import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Create root first, outside of any providers
const root = createRoot(document.getElementById("root")!);

// Render the app - providers are handled in App.tsx
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
