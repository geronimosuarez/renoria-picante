import type { DomainTime, FocusStats, SiteCategory } from './types';

/**
 * Suma `seconds` de tiempo en `domain` (categoría `category`) a las stats del día.
 * Devuelve una copia nueva (no muta el original).
 */
export function recordTime(
  stats: FocusStats,
  domain: string,
  category: SiteCategory,
  seconds: number,
): FocusStats {
  if (seconds <= 0 || !domain) return stats;

  const byDomain: DomainTime[] = stats.byDomain.map((d) => ({ ...d }));
  const existing = byDomain.find((d) => d.domain === domain);
  if (existing) {
    existing.seconds += seconds;
    existing.category = category;
  } else {
    byDomain.push({ domain, category, seconds });
  }

  return {
    ...stats,
    productiveSeconds: stats.productiveSeconds + (category === 'productive' ? seconds : 0),
    distractingSeconds: stats.distractingSeconds + (category === 'distracting' ? seconds : 0),
    neutralSeconds: stats.neutralSeconds + (category === 'neutral' ? seconds : 0),
    byDomain,
  };
}
