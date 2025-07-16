
import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { ThemeProvider } from './contexts/ThemeContext.tsx';
import { AuthProvider } from './contexts/AuthContext.tsx';
import { AnimationProvider } from './contexts/AnimationContext.tsx';
import { LicenseProvider } from './contexts/LicenseContext.tsx';

// Create root first, outside of any providers
const root = createRoot(document.getElementById("root")!);

// Then render the app with properly nested providers
root.render(
  <React.StrictMode>
    <AuthProvider>
      <LicenseProvider>
        <ThemeProvider>
          <AnimationProvider>
            <App />
          </AnimationProvider>
        </ThemeProvider>
      </LicenseProvider>
    </AuthProvider>
  </React.StrictMode>
);
