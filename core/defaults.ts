import type { CityState, FocusStats, PersistedState } from './types';

// Nota: no hay reglas de clasificación por defecto. La clasificación es 100%
// dirigida por el usuario (ver core/classifier.ts y core/curated.ts).

export const DEFAULT_IDLE_THRESHOLD_SECONDS = 60;

export function emptyCity(): CityState {
  return { coins: 0, buildings: 0, level: 1, condition: 100 };
}

export function emptyStats(date: string): FocusStats {
  return {
    date,
    productiveSeconds: 0,
    distractingSeconds: 0,
    neutralSeconds: 0,
    byDomain: [],
  };
}

export function initialState(date: string): PersistedState {
  return {
    city: emptyCity(),
    today: emptyStats(date),
    history: [],
    userRules: [],
    onboarded: false,
    settings: { idleThresholdSeconds: DEFAULT_IDLE_THRESHOLD_SECONDS },
  };
}
