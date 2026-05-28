import type { CityState } from './types';
import { POINTS_PER_PRODUCTIVE_SECOND } from './balance';

// El foco productivo es lo único que genera Renoria Points (`growthPoints`).
// El gasto de esos puntos (construir) vive en core/market.ts.

/** Suma Renoria Points por `deltaSeconds` de foco productivo. No muta. */
export function applyProductiveTime(city: CityState, deltaSeconds: number): CityState {
  if (deltaSeconds <= 0) return city;
  const growthPoints = city.growthPoints + deltaSeconds * POINTS_PER_PRODUCTIVE_SECOND;
  return { ...city, growthPoints };
}
