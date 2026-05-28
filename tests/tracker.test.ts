import { describe, expect, it } from 'vitest';
import { recordTime } from '../core/tracker';
import { emptyStats } from '../core/defaults';

describe('recordTime', () => {
  it('suma tiempo productivo a las stats y al dominio', () => {
    const result = recordTime(emptyStats('2026-05-28'), 'github.com', 'productive', 30);
    expect(result.productiveSeconds).toBe(30);
    expect(result.byDomain).toEqual([
      { domain: 'github.com', category: 'productive', seconds: 30 },
    ]);
  });
  it('acumula sobre un dominio existente', () => {
    const once = recordTime(emptyStats('2026-05-28'), 'github.com', 'productive', 30);
    const twice = recordTime(once, 'github.com', 'productive', 15);
    expect(twice.productiveSeconds).toBe(45);
    expect(twice.byDomain).toHaveLength(1);
    expect(twice.byDomain[0].seconds).toBe(45);
  });
  it('suma tiempo distractor al contador correcto', () => {
    const result = recordTime(emptyStats('2026-05-28'), 'youtube.com', 'distracting', 50);
    expect(result.distractingSeconds).toBe(50);
    expect(result.productiveSeconds).toBe(0);
  });
  it('ignora segundos <= 0 y dominio vacío', () => {
    const base = emptyStats('2026-05-28');
    expect(recordTime(base, 'github.com', 'productive', 0)).toBe(base);
    expect(recordTime(base, '', 'productive', 30)).toBe(base);
  });
  it('no muta el objeto original', () => {
    const base = emptyStats('2026-05-28');
    recordTime(base, 'github.com', 'productive', 30);
    expect(base.productiveSeconds).toBe(0);
    expect(base.byDomain).toHaveLength(0);
  });
});
