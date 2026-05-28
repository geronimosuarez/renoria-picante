import { describe, expect, it } from 'vitest';
import { buildUserRules } from '../core/onboarding';

describe('buildUserRules', () => {
  it('objeto vacío → []', () => {
    expect(buildUserRules({})).toEqual([]);
  });
  it('descarta las entradas neutral', () => {
    expect(buildUserRules({ 'example.com': 'neutral' })).toEqual([]);
  });
  it('mapea productive y distracting a reglas', () => {
    const rules = buildUserRules({
      'github.com': 'productive',
      'youtube.com': 'distracting',
      'example.com': 'neutral',
    });
    expect(rules).toContainEqual({ pattern: 'github.com', category: 'productive' });
    expect(rules).toContainEqual({ pattern: 'youtube.com', category: 'distracting' });
    expect(rules).toHaveLength(2);
  });
});
