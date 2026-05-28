import type { CityState } from './types';
import {
  BASE_BUILDING_COST,
  BUILDINGS_PER_LEVEL,
  COINS_PER_CONDITION_POINT,
  COINS_PER_PRODUCTIVE_MINUTE,
  CONDITION_LOSS_PER_DISTRACTING_MINUTE,
} from './balance';

/** Nivel derivado de la cantidad de edificios comprados. */
export function levelFromBuildings(buildings: number): number {
  return 1 + Math.floor(buildings / BUILDINGS_PER_LEVEL);
}

/** Suma monedas por `deltaSeconds` de foco productivo. No muta. */
export function applyProductiveTime(city: CityState, deltaSeconds: number): CityState {
  if (deltaSeconds <= 0) return city;
  const coins = city.coins + (deltaSeconds * COINS_PER_PRODUCTIVE_MINUTE) / 60;
  return { ...city, coins };
}

/** Baja la condición por `deltaSeconds` en distractores (piso 0). No muta. */
export function applyDistractingTime(city: CityState, deltaSeconds: number): CityState {
  if (deltaSeconds <= 0) return city;
  const loss = (deltaSeconds * CONDITION_LOSS_PER_DISTRACTING_MINUTE) / 60;
  const condition = Math.max(0, city.condition - loss);
  return { ...city, condition };
}

/** Costo del próximo edificio (crece ×2 por edificio comprado). */
export function buildingCost(buildings: number): number {
  return BASE_BUILDING_COST * 2 ** buildings;
}

/** ¿Alcanza el balance para comprar el próximo edificio? */
export function canBuy(city: CityState): boolean {
  return city.coins >= buildingCost(city.buildings);
}

/** Compra el próximo edificio si alcanza; si no, devuelve la ciudad sin cambios. */
export function buyBuilding(city: CityState): CityState {
  if (!canBuy(city)) return city;
  const buildings = city.buildings + 1;
  return {
    ...city,
    coins: city.coins - buildingCost(city.buildings),
    buildings,
    level: levelFromBuildings(buildings),
  };
}

/** Monedas necesarias para reparar la condición hasta 100%. */
export function repairCost(city: CityState): number {
  return (100 - city.condition) * COINS_PER_CONDITION_POINT;
}

/**
 * Repara parcialmente gastando hasta `coins` monedas.
 * Clampa al balance disponible y a lo que falta para llegar a 100%. No muta.
 */
export function repair(city: CityState, coins: number): CityState {
  const spend = Math.min(coins, city.coins, repairCost(city));
  if (spend <= 0) return city;
  const condition = Math.min(100, city.condition + spend / COINS_PER_CONDITION_POINT);
  return { ...city, coins: city.coins - spend, condition };
}
