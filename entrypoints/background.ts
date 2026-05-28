import { classify, domainFromUrl } from '../core/classifier';
import { recordTime } from '../core/tracker';
import { applyProductiveTime } from '../core/economy';
import { badgeTextForCity } from '../core/badge';
import { loadState, updateState, subscribe } from '../storage/storage';
import type { CityState, SiteCategory, PersistedState } from '../core/types';

// Pinta los puntos del usuario en el badge de la toolbar, tipo notificación.
// Con 0 puntos ocultamos el badge (texto vacío) para no ensuciar el icono.
function renderBadge(state: PersistedState) {
  const text = Math.round(state.city.growthPoints) >= 1 ? badgeTextForCity(state.city) : '';
  browser.action.setBadgeText({ text });
}

// `defineBackground` y `browser` son auto-importados por WXT.
export default defineBackground(() => {
  let activeDomain = '';
  let activeSince = 0; // timestamp ms del inicio del período actual
  let paused = false;

  function todayStr(now: number): string {
    return new Date(now).toISOString().slice(0, 10); // YYYY-MM-DD (UTC)
  }

  // Cola de escritura: serializa todos los updateState del SW (flush)
  // para que dos ciclos load→modify→save no se pisen y pierdan datos.
  let writeChain: Promise<unknown> = Promise.resolve();
  function enqueueWrite(task: () => Promise<unknown>): Promise<unknown> {
    writeChain = writeChain.then(task, task);
    return writeChain;
  }

  // Efecto de la categoría del sitio sobre la ciudad: solo el foco productivo
  // suma Renoria Points; distractores y neutrales no afectan el balance.
  function grow(city: CityState, category: SiteCategory, elapsed: number): CityState {
    if (category === 'productive') return applyProductiveTime(city, elapsed);
    return city;
  }

  // Persiste el tiempo transcurrido en el dominio activo y resetea el contador.
  function flush(now: number): Promise<unknown> {
    if (!activeDomain || paused || activeSince === 0) {
      activeSince = now;
      return Promise.resolve();
    }
    const elapsed = Math.floor((now - activeSince) / 1000);
    activeSince = now;
    if (elapsed <= 0) return Promise.resolve();

    const day = todayStr(now);
    const domain = activeDomain;
    return enqueueWrite(() =>
      updateState(day, (state) => {
        const category = classify(domain, state.userRules);
        const today = recordTime(state.today, domain, category, elapsed);
        const city = grow(state.city, category, elapsed);
        return { ...state, today, city };
      }),
    );
  }

  // Cierra el período anterior y empieza a contar el dominio de la tab activa.
  async function setActiveTab(now: number) {
    const [tab] = await browser.tabs.query({ active: true, lastFocusedWindow: true });
    await flush(now);
    activeDomain = tab?.url ? domainFromUrl(tab.url) : '';
    activeSince = now;
  }

  browser.tabs.onActivated.addListener(() => void setActiveTab(Date.now()));
  browser.tabs.onUpdated.addListener((_id, changeInfo, tab) => {
    if (changeInfo.url && tab.active) void setActiveTab(Date.now());
  });
  browser.windows.onFocusChanged.addListener((windowId) => {
    const now = Date.now();
    if (windowId === browser.windows.WINDOW_ID_NONE) {
      void flush(now);
      paused = true;
    } else {
      paused = false;
      void setActiveTab(now);
    }
  });

  // Idle: pausa el conteo cuando el usuario se inactiva o bloquea la pantalla.
  void loadState(todayStr(Date.now())).then((state) => {
    browser.idle.setDetectionInterval(state.settings.idleThresholdSeconds);
  });
  browser.idle.onStateChanged.addListener((newState) => {
    const now = Date.now();
    if (newState === 'active') {
      paused = false;
      void setActiveTab(now);
    } else {
      void flush(now);
      paused = true;
    }
  });

  // Flush periódico: el SW puede dormirse; la alarma lo despierta para persistir.
  browser.alarms.create('flush', { periodInMinutes: 1 });
  browser.alarms.onAlarm.addListener((alarm) => {
    if (alarm.name === 'flush') void flush(Date.now());
  });

  // El popup pide persistir lo acumulado (al abrir y cada pocos segundos), así
  // el balance real alcanza a la proyección en vivo sin esperar un evento del
  // navegador. El SW sigue siendo el único escritor del estado de la ciudad.
  browser.runtime.onMessage.addListener((msg: { type?: string }) => {
    if (msg?.type === 'FLUSH') void flush(Date.now());
  });

  void setActiveTab(Date.now());

  // Badge de la toolbar: color verde Renoria; texto blanco para contraste.
  browser.action.setBadgeBackgroundColor({ color: '#2e7d4f' });
  if (browser.action.setBadgeTextColor) {
    browser.action.setBadgeTextColor({ color: '#ffffff' });
  }

  // Estado inicial al arrancar el service worker.
  loadState(todayStr(Date.now())).then(renderBadge);

  // Mantener el badge en sync con cada cambio de estado (puntos, etc.).
  subscribe(renderBadge);
});
