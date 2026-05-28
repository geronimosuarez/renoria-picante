import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from '../popup/App';
import './style.css';

// La New Tab reusa la MISMA app que el popup (gate de onboarding → Home con
// la ciudad + puntos + Market), pero a viewport completo. Así cada pestaña
// nueva te muestra cómo va tu ciudad, y hereda toda la lógica del popup
// (puntos en vivo, flush, etc.) sin duplicar nada.
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
