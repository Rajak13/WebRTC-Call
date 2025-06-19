import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.jsx';
import './index.css';

// Create .env file if it doesn't exist
try {
  if (!import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY) {
    console.warn(
      'Supabase environment variables not found. Some functionality may not work properly. ' +
      'Please make sure to create a .env file with VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.'
    );
  }
} catch {
  console.warn('Unable to check for environment variables');
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
