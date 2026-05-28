import { describe, expect, it } from 'vitest';
import {
  canAfford,
  costOf,
  nextCost,
  ownedCount,
  purchase,
  MARKET_ITEMS,
} from '../core/market';
import { initialState } from '../core/defaults';
import type { PersistedState } from '../core/types';

// Estado base con suficientes puntos para comprar varias veces.
function stateWithPoints(points: number): PersistedState {
  const s = initialState('2026-05-28');
  // El estado inicial arranca con una casita; la vaciamos para tests deterministas.
  s.city = { ...s.city, growthPoints: points, buildings: [] };
  return s;
}

describe('catálogo del mercado', () => {
  it('sólo ofrece tipos modelados en 3D (house, building)', () => {
    expect(MARKET_ITEMS.map((i) => i.key)).toEqual(['house', 'building']);
  });
});

describe('costOf', () => {
  it('el primer ejemplar cuesta el precio base', () => {
    expect(costOf(45, 0)).toBe(45);
  });
  it('escala ×1.45 por cada ejemplar poseído', () => {
    expect(costOf(45, 1)).toBe(65); // round(45 * 1.45)
    expect(costOf(45, 2)).toBe(95); // round(45 * 1.45^2)
  });
});

describe('ownedCount', () => {
  it('cuenta sólo las construcciones del tipo dado', () => {
    const buildings = [{ type: 'house' as const }, { type: 'building' as const }, { type: 'house' as const }];
    expect(ownedCount(buildings, 'house')).toBe(2);
    expect(ownedCount(buildings, 'building')).toBe(1);
  });
});

describe('nextCost / canAfford', () => {
  it('el costo siguiente sube tras cada compra del mismo tipo', () => {
    const s = stateWithPoints(1000);
    expect(nextCost(s, 'house')).toBe(45);
    const s2 = purchase(s, 'house');
    expect(nextCost(s2, 'house')).toBe(65);
  });
  it('canAfford refleja el balance', () => {
    expect(canAfford(stateWithPoints(45), 'house')).toBe(true);
    expect(canAfford(stateWithPoints(44), 'house')).toBe(false);
  });
});

describe('purchase', () => {
  it('descuenta puntos y agrega la construcción a la ciudad', () => {
    const result = purchase(stateWithPoints(100), 'house');
    expect(result.city.growthPoints).toBe(55); // 100 - 45
    expect(result.city.buildings).toEqual([{ type: 'house' }]);
  });
  it('no hace nada si no alcanzan los puntos (mismo objeto)', () => {
    const base = stateWithPoints(44);
    expect(purchase(base, 'house')).toBe(base);
  });
  it('no muta el estado original', () => {
    const base = stateWithPoints(100);
    purchase(base, 'house');
    expect(base.city.growthPoints).toBe(100);
    expect(base.city.buildings).toHaveLength(0);
  });
  it('encadena compras con costo creciente', () => {
    let s = stateWithPoints(200);
    s = purchase(s, 'house'); // -45 → 155
    s = purchase(s, 'house'); // -65 → 90
    expect(s.city.growthPoints).toBe(90);
    expect(ownedCount(s.city.buildings, 'house')).toBe(2);
  });
});
