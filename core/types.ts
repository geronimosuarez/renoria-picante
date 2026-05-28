/** Clasificación de un sitio. */
export type SiteCategory = 'productive' | 'distracting' | 'neutral';

/** Regla de clasificación (default del sistema u override del usuario). */
export interface CategoryRule {
  pattern: string; // dominio, ej "youtube.com"
  category: SiteCategory;
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
