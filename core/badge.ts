import type { CityState } from './types';

// El badge de la toolbar sólo cabe ~4 caracteres, así que compactamos:
// 0–999 → tal cual, 1_000+ → "1.2k" / "12k", 1_000_000+ → "1.2M".
export function badgeText(points: number): string {
  const p = Math.max(0, Math.round(points));
  if (p < 1000) return String(p);
  if (p < 1_000_000) {
    const k = p / 1000;
    return (k < 10 ? k.toFixed(1).replace(/\.0$/, '') : Math.round(k).toString()) + 'k';
  }
  const m = p / 1_000_000;
  return (m < 10 ? m.toFixed(1).replace(/\.0$/, '') : Math.round(m).toString()) + 'M';
}

export function badgeTextForCity(city: CityState): string {
  return badgeText(city.growthPoints);
}
