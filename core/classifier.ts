import type { CategoryRule, SiteCategory } from './types';

/**
 * Extrae el dominio registrable simplificado de una URL.
 * Devuelve '' si no es http(s) (ej: chrome://, about:, file:).
 */
export function domainFromUrl(url: string): string {
  try {
    const u = new URL(url);
    if (u.protocol !== 'http:' && u.protocol !== 'https:') return '';
    return u.hostname.replace(/^www\./, '');
  } catch {
    return '';
  }
}

/**
 * Clasifica un dominio. La clasificación es 100% dirigida por el usuario:
 * recorre SOLO `userRules` (no hay defaults del sistema). Un dominio matchea
 * si es igual al pattern o un subdominio de él; gana el primer match.
 * Sin match (o dominio vacío) → 'neutral'.
 */
export function classify(domain: string, userRules: CategoryRule[]): SiteCategory {
  if (!domain) return 'neutral';
  for (const rule of userRules) {
    if (domain === rule.pattern || domain.includes('.' + rule.pattern)) {
      return rule.category;
    }
  }
  return 'neutral';
}
