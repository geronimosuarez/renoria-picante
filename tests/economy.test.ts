import { describe, expect, it } from 'vitest';
import { applyProductiveTime } from '../core/economy';
import { emptyCity } from '../core/defaults';

describe('applyProductiveTime', () => {
  it('suma 2 puntos por segundo productivo', () => {
    expect(applyProductiveTime(emptyCity(), 1).growthPoints).toBe(2);
  });
  it('es proporcional al delta (10s → 20 puntos)', () => {
    expect(applyProductiveTime(emptyCity(), 10).growthPoints).toBe(20);
  });
  it('no cambia nada con delta <= 0', () => {
    const c = emptyCity();
    expect(applyProductiveTime(c, 0)).toBe(c);
    expect(applyProductiveTime(c, -10)).toBe(c);
  });
  it('no toca los edificios', () => {
    expect(applyProductiveTime(emptyCity(), 1).buildings).toEqual([{ type: 'house' }]);
  });
});
