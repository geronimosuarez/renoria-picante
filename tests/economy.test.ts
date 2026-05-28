import { describe, expect, it } from 'vitest';
import { applyProductiveTime } from '../core/economy';
import { POINTS_PER_PRODUCTIVE_SECOND } from '../core/balance';
import { emptyCity } from '../core/defaults';

describe('applyProductiveTime', () => {
  it('suma POINTS_PER_PRODUCTIVE_SECOND por segundo productivo', () => {
    expect(applyProductiveTime(emptyCity(), 1).growthPoints).toBe(POINTS_PER_PRODUCTIVE_SECOND);
  });
  it('es proporcional al delta (10s)', () => {
    expect(applyProductiveTime(emptyCity(), 10).growthPoints).toBe(10 * POINTS_PER_PRODUCTIVE_SECOND);
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
