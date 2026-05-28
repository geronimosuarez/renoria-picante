import { describe, expect, it } from 'vitest';
import {
  applyDistractingTime,
  applyProductiveTime,
  buildingCost,
  buyBuilding,
  canBuy,
  levelFromBuildings,
  repair,
  repairCost,
} from '../core/economy';
import { emptyCity } from '../core/defaults';

describe('applyProductiveTime', () => {
  it('suma 2 monedas por minuto productivo', () => {
    expect(applyProductiveTime(emptyCity(), 60).coins).toBe(2);
  });
  it('es proporcional al delta (30s → 1 moneda)', () => {
    expect(applyProductiveTime(emptyCity(), 30).coins).toBe(1);
  });
  it('no cambia nada con delta <= 0', () => {
    const c = emptyCity();
    expect(applyProductiveTime(c, 0)).toBe(c);
    expect(applyProductiveTime(c, -10)).toBe(c);
  });
  it('no toca la condición', () => {
    expect(applyProductiveTime(emptyCity(), 60).condition).toBe(100);
  });
});

describe('applyDistractingTime', () => {
  it('baja 1 punto de condición por minuto distractor', () => {
    expect(applyDistractingTime(emptyCity(), 60).condition).toBe(99);
  });
  it('tiene piso en 0 (no negativo)', () => {
    expect(applyDistractingTime(emptyCity(), 60 * 200).condition).toBe(0);
  });
  it('no toca las monedas', () => {
    expect(applyDistractingTime(emptyCity(), 60).coins).toBe(0);
  });
  it('no cambia nada con delta <= 0', () => {
    const c = emptyCity();
    expect(applyDistractingTime(c, 0)).toBe(c);
  });
});

describe('buildingCost', () => {
  it('progresa ×2: 10, 20, 40', () => {
    expect(buildingCost(0)).toBe(10);
    expect(buildingCost(1)).toBe(20);
    expect(buildingCost(2)).toBe(40);
  });
});

describe('canBuy / buyBuilding', () => {
  it('canBuy es false sin monedas suficientes', () => {
    expect(canBuy(emptyCity())).toBe(false);
  });
  it('compra: descuenta el costo, suma edificio y recalcula el nivel', () => {
    const after = buyBuilding({ ...emptyCity(), coins: 25 });
    expect(after.coins).toBe(15); // 25 - 10
    expect(after.buildings).toBe(1);
    expect(after.level).toBe(1);
  });
  it('sin monedas suficientes devuelve la ciudad sin cambios', () => {
    const poor = { ...emptyCity(), coins: 5 };
    expect(buyBuilding(poor)).toBe(poor);
  });
});

describe('levelFromBuildings', () => {
  it('0–2 edificios → nivel 1; 3 → nivel 2', () => {
    expect(levelFromBuildings(0)).toBe(1);
    expect(levelFromBuildings(2)).toBe(1);
    expect(levelFromBuildings(3)).toBe(2);
  });
});

describe('repairCost / repair', () => {
  it('repairCost: 0 a 100% de condición; 40 a 60%', () => {
    expect(repairCost(emptyCity())).toBe(0);
    expect(repairCost({ ...emptyCity(), condition: 60 })).toBe(40);
  });
  it('repara parcialmente gastando menos que el total', () => {
    const after = repair({ ...emptyCity(), condition: 60, coins: 100 }, 10);
    expect(after.condition).toBe(70);
    expect(after.coins).toBe(90);
  });
  it('clampa: no sube de 100 ni gasta más que repairCost', () => {
    const after = repair({ ...emptyCity(), condition: 90, coins: 100 }, 50);
    expect(after.condition).toBe(100);
    expect(after.coins).toBe(90); // solo gastó 10
  });
  it('clampa al balance disponible (reparación parcial por falta de monedas)', () => {
    const after = repair({ ...emptyCity(), condition: 50, coins: 20 }, 50);
    expect(after.condition).toBe(70); // 20 monedas → +20 condición
    expect(after.coins).toBe(0);
  });
  it('sin monedas no cambia nada', () => {
    const broke = { ...emptyCity(), condition: 50, coins: 0 };
    expect(repair(broke, 50)).toBe(broke);
  });
});
