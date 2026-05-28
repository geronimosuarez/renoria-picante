/** Clasificación de un sitio. */
export type SiteCategory = 'productive' | 'distracting' | 'neutral';

/** Regla de clasificación definida por el usuario. */
export interface CategoryRule {
  pattern: string; // dominio, ej "youtube.com"
  category: SiteCategory;
}

/**
 * Sitio de la lista curada: solo alimenta las sugerencias del onboarding.
 * NO participa de `classify` (la clasificación es 100% dirigida por el usuario).
 */
export interface CuratedSite {
  pattern: string;
  suggested: 'productive' | 'distracting';
}

/** Tiempo acumulado por dominio dentro de un día. */
export interface DomainTime {
  domain: string;
  category: SiteCategory;
  seconds: number;
}

/** Stats de foco de un día. */
export interface FocusStats {
  date: string; // YYYY-MM-DD
  productiveSeconds: number;
  distractingSeconds: number;
  neutralSeconds: number;
  byDomain: DomainTime[];
}

/** Estado de la ciudad — agnóstico al render. */
export interface CityState {
  coins: number; // balance gastable (float; la UI lo muestra floor)
  buildings: number; // edificios comprados (abstracto)
  level: number; // derivado de buildings
  condition: number; // 0–100, salud de la ciudad (alimenta ruinLevel del render)
}

/** Acción que el popup le pide al service worker (único escritor). */
export type CityAction =
  | { type: 'BUY_BUILDING' }
  | { type: 'REPAIR'; coins: number }; // monedas a gastar (reparación parcial)

/** Estado persistido completo en chrome.storage.local. */
export interface PersistedState {
  city: CityState;
  today: FocusStats;
  history: FocusStats[]; // días previos (más recientes primero)
  userRules: CategoryRule[]; // overrides del usuario
  onboarded: boolean; // true una vez que el usuario completó el onboarding
  settings: {
    idleThresholdSeconds: number; // umbral para considerar al usuario inactivo
  };
}
