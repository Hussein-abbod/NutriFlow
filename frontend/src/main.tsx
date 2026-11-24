import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from '@/app/App';
import { initPwa } from '@/lib/platform/pwa';
import { initTheme } from '@/lib/theme';
import '@/styles/global.css';

initTheme();
initPwa();

const rootElement = document.getElementById('root');
if (!rootElement) throw new Error('Root element #root not found');

createRoot(rootElement).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
