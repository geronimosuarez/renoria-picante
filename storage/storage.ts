import type { PersistedState } from '../core/types';
import { emptyStats, initialState } from '../core/defaults';

const STORAGE_KEY = 'renoria_state';

/** Si el día guardado no es hoy, archiva `today` en history y arranca un día nuevo. */
export function rollover(state: PersistedState, today: string): PersistedState {
  if (state.today.date === today) return state;
  return {
    ...state,
    today: emptyStats(today),
    history: [state.today, ...state.history].slice(0, 30),
  };
}

export async function loadState(today: string): Promise<PersistedState> {
  const result = await browser.storage.local.get(STORAGE_KEY);
  const stored = result[STORAGE_KEY] as PersistedState | undefined;
  if (!stored) return initialState(today);
  // Compatibilidad con estados previos al flag de onboarding.
  if (typeof stored.onboarded !== 'boolean') stored.onboarded = false;
  return rollover(stored, today);
}

export async function saveState(state: PersistedState): Promise<void> {
  await browser.storage.local.set({ [STORAGE_KEY]: state });
}

/** Carga, aplica el updater y persiste. Devuelve el estado nuevo. */
export async function updateState(
  today: string,
  updater: (state: PersistedState) => PersistedState,
): Promise<PersistedState> {
  const current = await loadState(today);
  const next = updater(current);
  await saveState(next);
  return next;
}

/** Suscribe a cambios del estado. Devuelve una función para desuscribir. */
export function subscribe(callback: (state: PersistedState) => void): () => void {
  const listener = (changes: Record<string, { newValue?: unknown }>, area: string) => {
    if (area === 'local' && changes[STORAGE_KEY]?.newValue) {
      callback(changes[STORAGE_KEY].newValue as PersistedState);
    }
  };
  browser.storage.onChanged.addListener(listener);
  return () => browser.storage.onChanged.removeListener(listener);
}
