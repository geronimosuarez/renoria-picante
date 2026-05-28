import type { CategoryRule, CityState, FocusStats, PersistedState } from './types';

/** Reglas por defecto (out-of-the-box). El usuario puede sobrescribirlas. */
export const DEFAULT_RULES: CategoryRule[] = [
  { pattern: 'youtube.com', category: 'distracting' },
  { pattern: 'facebook.com', category: 'distracting' },
  { pattern: 'instagram.com', category: 'distracting' },
  { pattern: 'twitter.com', category: 'distracting' },
  { pattern: 'x.com', category: 'distracting' },
  { pattern: 'tiktok.com', category: 'distracting' },
  { pattern: 'reddit.com', category: 'distracting' },
  { pattern: 'netflix.com', category: 'distracting' },
  { pattern: 'twitch.tv', category: 'distracting' },
  { pattern: 'github.com', category: 'productive' },
  { pattern: 'stackoverflow.com', category: 'productive' },
  { pattern: 'developer.mozilla.org', category: 'productive' },
  { pattern: 'docs.google.com', category: 'productive' },
  { pattern: 'notion.so', category: 'productive' },
  { pattern: 'linear.app', category: 'productive' },
];

export const DEFAULT_IDLE_THRESHOLD_SECONDS = 60;

export function emptyCity(): CityState {
  return { growthPoints: 0, level: 1, buildings: 0 };
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
