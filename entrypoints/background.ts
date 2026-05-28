import { classify, domainFromUrl } from '../core/classifier';
import { recordTime } from '../core/tracker';
import {
  applyDistractingTime,
  applyProductiveTime,
  buyBuilding,
  repair,
} from '../core/economy';
import { loadState, updateState } from '../storage/storage';
import type { CityAction, CityState, SiteCategory } from '../core/types';

// `defineBackground` y `browser` son auto-importados por WXT.
export default defineBackground(() => {
  let activeDomain = '';
  let activeSince = 0; // timestamp ms del inicio del período actual
  let paused = false;

  function todayStr(now: number): string {
    return new Date(now).toISOString().slice(0, 10); // YYYY-MM-DD (UTC)
  }

  // Cola de escritura: serializa todos los updateState del SW (flush + acciones)
  // para que dos ciclos load→modify→save no se pisen y pierdan datos.
  let writeChain: Promise<unknown> = Promise.resolve();
  function enqueueWrite(task: () => Promise<unknown>): Promise<unknown> {
    writeChain = writeChain.then(task, task);
    return writeChain;
  }

  // Efecto de la categoría del sitio sobre la ciudad.
  function grow(city: CityState, category: SiteCategory, elapsed: number): CityState {
    if (category === 'productive') return applyProductiveTime(city, elapsed);
    if (category === 'distracting') return applyDistractingTime(city, elapsed);
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

  // Acciones del usuario (popup). Pasan por la misma cola de escritura.
  function handleAction(action: CityAction): Promise<unknown> {
    if (!action || (action.type !== 'BUY_BUILDING' && action.type !== 'REPAIR')) {
      return Promise.resolve();
    }
    const day = todayStr(Date.now());
    return enqueueWrite(() =>
      updateState(day, (state) => {
        if (action.type === 'BUY_BUILDING') {
          return { ...state, city: buyBuilding(state.city) };
        }
        const coins = typeof action.coins === 'number' ? action.coins : 0;
        return { ...state, city: repair(state.city, coins) };
      }),
    );
  }

  browser.runtime.onMessage.addListener((message: CityAction) => {
    void handleAction(message);
  });

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

  void setActiveTab(Date.now());
});
