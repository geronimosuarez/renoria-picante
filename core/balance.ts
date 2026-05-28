// Balance de la economía. Punto de partida tuneable (se afina con datos reales).

/** Monedas ganadas por minuto de foco productivo. */
export const COINS_PER_PRODUCTIVE_MINUTE = 2;

/** Puntos de condición (0–100) perdidos por minuto en sitios distractores. */
export const CONDITION_LOSS_PER_DISTRACTING_MINUTE = 1;

/** Monedas que cuesta reparar 1 punto de condición. */
export const COINS_PER_CONDITION_POINT = 1;

/** Costo del primer edificio. Cada edificio comprado duplica el costo del siguiente. */
export const BASE_BUILDING_COST = 10;

/** Cantidad de edificios que suben un nivel. */
export const BUILDINGS_PER_LEVEL = 3;
