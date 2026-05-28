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
  growthPoints: number; // puntos acumulados de foco productivo
  level: number; // etapa de la ciudad
  buildings: number; // elementos desbloqueados (abstracto)
}

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
