import type { CategoryRule, SiteCategory } from './types';

/**
 * Transforma las selecciones del onboarding en reglas del usuario.
 * - Descarta las entradas 'neutral' (no generan regla → quedan neutrales).
 * - Mapea el resto a { pattern, category }.
 *
 * `selections` está keyeado por dominio (pattern).
 */
export function buildUserRules(selections: Record<string, SiteCategory>): CategoryRule[] {
  const rules: CategoryRule[] = [];
  for (const [pattern, category] of Object.entries(selections)) {
    if (category === 'neutral') continue;
    rules.push({ pattern, category });
  }
  return rules;
}
