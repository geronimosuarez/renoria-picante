import type { CategoryRule, SiteCategory } from './types';
import { CURATED_SITES } from './curated';

/**
 * Construye las reglas del usuario combinando dos capas:
 * 1. **Base:** las sugerencias de la lista curada (github→productive,
 *    youtube→distracting, …). Así, terminar el onboarding sin ordenar nada
 *    igual deja reglas sensatas en vez de dejar todo neutral.
 * 2. **Override:** las selecciones explícitas del onboarding pisan la base
 *    (swipear una tarjeta gana sobre la sugerencia; 'neutral' quita la regla).
 *
 * `selections` está keyeado por dominio (pattern).
 */
export function buildUserRules(selections: Record<string, SiteCategory>): CategoryRule[] {
  const byPattern = new Map<string, SiteCategory>();
  for (const c of CURATED_SITES) byPattern.set(c.pattern, c.suggested);
  for (const [pattern, category] of Object.entries(selections)) {
    if (category === 'neutral') byPattern.delete(pattern);
    else byPattern.set(pattern, category);
  }
  return [...byPattern].map(([pattern, category]) => ({ pattern, category }));
}
