import type { CityBuilding, PersistedState } from './types';

// Mercado de Renoria: gastar Renoria Points (`city.growthPoints`) para construir
// estructuras en la ciudad. Núcleo puro y testeable; la UI vive en
// components/renoria/Market.tsx.
//
// Por ahora sólo se ofrecen los tipos que ya están modelados en 3D
// (`house`, `building`). Road y Park quedan para cuando tengan arte 3D.

/** Clave de un ítem comprable en el mercado (subconjunto de BuildingType). */
export type MarketItemKey = 'house' | 'building';

/** Definición de un ítem del catálogo del mercado. */
export interface MarketItem {
  key: MarketItemKey;
  name: string;
  flavor: string;
  base: number; // costo del primer ejemplar
}

/** Catálogo del mercado, en orden de presentación (de más barato a más caro). */
export const MARKET_ITEMS: MarketItem[] = [
  { key: 'house', name: 'House', flavor: 'Homes for focused folk', base: 45 },
  { key: 'building', name: 'Building', flavor: 'A landmark rises', base: 170 },
];

/** Factor de escalada de precio por cada ejemplar ya construido. */
export const COST_GROWTH = 1.45;

/** Costo del próximo ejemplar dado el costo base y cuántos ya se poseen. */
export function costOf(base: number, owned: number): number {
  return Math.round(base * Math.pow(COST_GROWTH, owned));
}

/** Cuántas construcciones de un tipo posee el usuario. */
export function ownedCount(buildings: CityBuilding[], key: MarketItemKey): number {
  return buildings.filter((b) => b.type === key).length;
}

/** Costo del próximo ejemplar de `key` según el estado actual. */
export function nextCost(state: PersistedState, key: MarketItemKey): number {
  const item = MARKET_ITEMS.find((i) => i.key === key);
  if (!item) return Infinity;
  return costOf(item.base, ownedCount(state.city.buildings, key));
}

/** ¿Alcanzan los puntos para comprar el próximo `key`? */
export function canAfford(state: PersistedState, key: MarketItemKey): boolean {
  return state.city.growthPoints >= nextCost(state, key);
}

/**
 * Compra una estructura: descuenta los puntos y la agrega a la ciudad.
 * Devuelve un estado nuevo; si no alcanza (o la clave es inválida) devuelve
 * el mismo estado sin tocar (no muta el original).
 */
export function purchase(state: PersistedState, key: MarketItemKey): PersistedState {
  const cost = nextCost(state, key);
  if (!isFinite(cost) || state.city.growthPoints < cost) return state;
  return {
    ...state,
    city: {
      ...state.city,
      growthPoints: state.city.growthPoints - cost,
      buildings: [...state.city.buildings, { type: key }],
    },
  };
}
