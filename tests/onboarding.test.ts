import { describe, expect, it } from 'vitest';
import { buildUserRules } from '../core/onboarding';
import { CURATED_SITES } from '../core/curated';

describe('buildUserRules', () => {
  it('sin selecciones → siembra todas las sugerencias curadas', () => {
    const rules = buildUserRules({});
    expect(rules).toHaveLength(CURATED_SITES.length);
    expect(rules).toContainEqual({ pattern: 'github.com', category: 'productive' });
    expect(rules).toContainEqual({ pattern: 'youtube.com', category: 'distracting' });
  });

  it('una selección explícita pisa la sugerencia curada (no agrega)', () => {
    const rules = buildUserRules({ 'github.com': 'distracting' });
    expect(rules).toHaveLength(CURATED_SITES.length);
    expect(rules).toContainEqual({ pattern: 'github.com', category: 'distracting' });
    expect(rules).not.toContainEqual({ pattern: 'github.com', category: 'productive' });
  });

  it("'neutral' quita la regla curada", () => {
    const rules = buildUserRules({ 'github.com': 'neutral' });
    expect(rules).toHaveLength(CURATED_SITES.length - 1);
    expect(rules.find((r) => r.pattern === 'github.com')).toBeUndefined();
  });

  it('un sitio custom ordenado se agrega sobre la base curada', () => {
    const rules = buildUserRules({ 'miblog.dev': 'productive' });
    expect(rules).toHaveLength(CURATED_SITES.length + 1);
    expect(rules).toContainEqual({ pattern: 'miblog.dev', category: 'productive' });
  });
});
