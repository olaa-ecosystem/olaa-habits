import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './app/App';
import { startCloudSync } from './services/cloudSync';
import { startLanguageEvents } from './services/languageEvents';
import './styles/global.css';
import './styles/layout.css';

const root = document.getElementById('root');
if (!root) throw new Error('Root element #root not found');

startCloudSync();
startLanguageEvents();

createRoot(root).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
