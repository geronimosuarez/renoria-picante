import { badgeTextForCity } from '../core/badge';
import { loadState, subscribe } from '../storage/storage';
import type { PersistedState } from '../core/types';

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

// Pinta los puntos del usuario en el badge de la toolbar, tipo notificación.
// Con 0 puntos ocultamos el badge (texto vacío) para no ensuciar el icono.
function renderBadge(state: PersistedState) {
  const text = Math.round(state.city.growthPoints) >= 1 ? badgeTextForCity(state.city) : '';
  browser.action.setBadgeText({ text });
}

// `defineBackground` y `browser` son auto-importados por WXT.
export default defineBackground(() => {
  // Color verde Renoria; texto blanco para contraste.
  browser.action.setBadgeBackgroundColor({ color: '#2e7d4f' });
  if (browser.action.setBadgeTextColor) {
    browser.action.setBadgeTextColor({ color: '#ffffff' });
  }

  // Estado inicial al arrancar el service worker.
  loadState(today()).then(renderBadge);

  // Mantener el badge en sync con cada cambio de estado (puntos, etc.).
  subscribe(renderBadge);
});
