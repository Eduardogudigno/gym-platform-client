import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '@fontsource/karla/latin-400.css';
import '@fontsource/karla/latin-600.css';
import '@fontsource/karla/latin-700.css';
import '@fontsource/lora/latin-500.css';
import '@fontsource/lora/latin-600.css';
import '@fontsource/yellowtail/latin-400.css';
import { App } from './App';
import './index.css';

const root = document.getElementById('root');
if (!root) throw new Error('Root element missing');

createRoot(root).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
