# Economía de puntuación — Plan de implementación

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Construir el motor de economía de la ciudad: el foco productivo da monedas gastables, el tiempo en distractores baja la condición de la ciudad (que alimenta el `ruinLevel` del render), y el usuario gasta monedas para construir edificios o reparar — todo cableado de punta a punta (service worker + popup).

**Architecture:** Lógica pura en `core/` (sin Chrome ni React, testeable con Vitest). El service worker es el **único escritor** de estado, con una cola de escritura que serializa el flush del tracking y las acciones del usuario. El popup **no escribe** estado de ciudad: muestra el estado y manda acciones (`BUY_BUILDING` / `REPAIR`) por `chrome.runtime.sendMessage`. El render three.js existente (`CityCanvas`) consume `condition` vía su prop `ruinLevel`.

**Tech Stack:** WXT (sobre Vite) + React + TypeScript · Vitest (+ `fakeBrowser` de WXT) · ESLint + Prettier · Manifest V3.

**Spec de referencia:** `docs/superpowers/specs/2026-05-28-economia-puntuacion-design.md`

**Metodología:** **Sin TDD.** Se implementa primero y los tests van después como verificación, solo en los módulos puros (`economy`, `tracker`).

**Rama:** `spec/economia-puntuacion` (ya creada desde `main`).

---

## Contexto: estado de `main`

- **Ya existe:** `core/classifier.ts` (user-driven), `core/curated.ts`, `core/onboarding.ts`, `core/defaults.ts`, `storage/storage.ts` (`loadState`/`updateState`/`subscribe`/`rollover`), el onboarding, y el render three.js (`components/renoria/CityCanvas.tsx` con prop `ruinLevel` 0..1).
- **No existe:** el tracking. `entrypoints/background.ts` es un **stub**; no hay `core/tracker.ts` ni motor de economía. Este plan los construye.
- **Migración:** `CityState` pasa de `{ growthPoints, level, buildings }` a `{ coins, buildings, level, condition }`. Consumidores de `growthPoints`: `core/types.ts`, `core/defaults.ts`, `entrypoints/popup/Home.tsx`.

## Estructura de archivos

| Archivo | Acción | Responsabilidad |
|---|---|---|
| `core/types.ts` | Modificar | Nuevo `CityState` + tipo `CityAction` |
| `core/defaults.ts` | Modificar | `emptyCity()` al shape nuevo |
| `core/balance.ts` | Crear | Constantes de balance (tuneables) |
| `core/economy.ts` | Crear | Funciones puras de la economía |
| `core/tracker.ts` | Crear | `recordTime`: acumulación de tiempo por dominio (puro) |
| `entrypoints/background.ts` | Reemplazar | Service worker: tracking + economía + acciones (único escritor) |
| `entrypoints/popup/Home.tsx` | Modificar | Balance gastable, ruina por condición, botones Construir/Reparar |
| `tests/economy.test.ts` | Crear | Verificación de `core/economy.ts` |
| `tests/tracker.test.ts` | Crear | Verificación de `core/tracker.ts` |

---

## Task 1: Modelo de datos — `CityState` + `CityAction`

**Files:**
- Modify: `core/types.ts:35-40` (bloque `CityState`)
- Modify: `core/defaults.ts:8-10` (`emptyCity`)
- Modify: `entrypoints/popup/Home.tsx:15` (display de puntos)

- [ ] **Step 1: Reemplazar el bloque `CityState` en `core/types.ts` y agregar `CityAction`**

Reemplazar:

```ts
/** Estado de la ciudad — agnóstico al render. */
export interface CityState {
  growthPoints: number; // puntos acumulados de foco productivo
  level: number; // etapa de la ciudad
  buildings: number; // elementos desbloqueados (abstracto)
}
```

por:

```ts
/** Estado de la ciudad — agnóstico al render. */
export interface CityState {
  coins: number; // balance gastable (float; la UI lo muestra floor)
  buildings: number; // edificios comprados (abstracto)
  level: number; // derivado de buildings
  condition: number; // 0–100, salud de la ciudad (alimenta ruinLevel del render)
}

/** Acción que el popup le pide al service worker (único escritor). */
export type CityAction =
  | { type: 'BUY_BUILDING' }
  | { type: 'REPAIR'; coins: number }; // monedas a gastar (reparación parcial)
```

- [ ] **Step 2: Actualizar `emptyCity()` en `core/defaults.ts`**

Reemplazar:

```ts
export function emptyCity(): CityState {
  return { growthPoints: 0, level: 1, buildings: 0 };
}
```

por:

```ts
export function emptyCity(): CityState {
  return { coins: 0, buildings: 0, level: 1, condition: 100 };
}
```

- [ ] **Step 3: Migrar el display en `entrypoints/popup/Home.tsx`**

En la línea `const points = Math.round(city.growthPoints);`, reemplazar por:

```ts
  const points = Math.floor(city.coins);
```

(El resto de `Home.tsx` se actualiza en la Task 6; este cambio mínimo solo mantiene el compile verde.)

- [ ] **Step 4: Verificar compile + tests existentes**

Run:
```bash
npm run compile
npm run test
```
Expected: `tsc` sin errores; todos los tests existentes (`classifier`, `onboarding`, `popup-gate`) en PASS. `popup-gate` renderiza `Home` con `city.coins = 0` (muestra "0 pts") y sigue verde.

- [ ] **Step 5: Commit**

```bash
git add core/types.ts core/defaults.ts entrypoints/popup/Home.tsx
git commit -m "feat(core): modelo de economía en CityState + tipo CityAction"
```

---

## Task 2: Constantes de balance (`core/balance.ts`)

**Files:**
- Create: `core/balance.ts`

- [ ] **Step 1: Crear `core/balance.ts`**

```ts
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
```

- [ ] **Step 2: Verificar compile**

Run: `npm run compile`
Expected: sin errores.

- [ ] **Step 3: Commit**

```bash
git add core/balance.ts
git commit -m "feat(core): constantes de balance de la economía"
```

---

## Task 3: Motor de economía (`core/economy.ts`)

**Files:**
- Create: `core/economy.ts`
- Test: `tests/economy.test.ts`

- [ ] **Step 1: Implementar `core/economy.ts`**

```ts
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
```

- [ ] **Step 2: Escribir los tests de verificación**

Crear `tests/economy.test.ts`:

```ts
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
```

- [ ] **Step 3: Correr los tests y verificar que pasan**

Run: `npm run test -- economy`
Expected: PASS (todos los `describe`).

- [ ] **Step 4: Commit**

```bash
git add core/economy.ts tests/economy.test.ts
git commit -m "feat(core): motor de economía (monedas, condición, build, repair)"
```

---

## Task 4: Acumulación de tiempo (`core/tracker.ts`)

**Files:**
- Create: `core/tracker.ts`
- Test: `tests/tracker.test.ts`

- [ ] **Step 1: Implementar `core/tracker.ts`**

```ts
import type { DomainTime, FocusStats, SiteCategory } from './types';

/**
 * Suma `seconds` de tiempo en `domain` (categoría `category`) a las stats del día.
 * Devuelve una copia nueva (no muta el original).
 */
export function recordTime(
  stats: FocusStats,
  domain: string,
  category: SiteCategory,
  seconds: number,
): FocusStats {
  if (seconds <= 0 || !domain) return stats;

  const byDomain: DomainTime[] = stats.byDomain.map((d) => ({ ...d }));
  const existing = byDomain.find((d) => d.domain === domain);
  if (existing) {
    existing.seconds += seconds;
    existing.category = category;
  } else {
    byDomain.push({ domain, category, seconds });
  }

  return {
    ...stats,
    productiveSeconds: stats.productiveSeconds + (category === 'productive' ? seconds : 0),
    distractingSeconds: stats.distractingSeconds + (category === 'distracting' ? seconds : 0),
    neutralSeconds: stats.neutralSeconds + (category === 'neutral' ? seconds : 0),
    byDomain,
  };
}
```

- [ ] **Step 2: Escribir los tests de verificación**

Crear `tests/tracker.test.ts`:

```ts
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
```

- [ ] **Step 3: Correr los tests y verificar que pasan**

Run: `npm run test -- tracker`
Expected: PASS (5 tests).

- [ ] **Step 4: Commit**

```bash
git add core/tracker.ts tests/tracker.test.ts
git commit -m "feat(core): acumulación de tiempo por dominio"
```

---

## Task 5: Service worker — tracking + economía + acciones (`entrypoints/background.ts`)

**Files:**
- Modify: `entrypoints/background.ts` (reemplaza el stub)

> Es código de cableado (glue) de eventos de Chrome con los módulos ya verificados. La verificación es **manual** cargando la extensión, porque depende de APIs del navegador.

- [ ] **Step 1: Reemplazar el contenido de `entrypoints/background.ts`**

```ts
import { classify, domainFromUrl } from '../core/classifier';
import { recordTime } from '../core/tracker';
import {
  applyDistractingTime,
  applyProductiveTime,
  buyBuilding,
  repair,
} from '../core/economy';
import { loadState, updateState } from '../storage/storage';
import type { CityAction, CityState, SiteCategory } from '../core/types';

// `defineBackground` y `browser` son auto-importados por WXT.
export default defineBackground(() => {
  let activeDomain = '';
  let activeSince = 0; // timestamp ms del inicio del período actual
  let paused = false;

  function todayStr(now: number): string {
    return new Date(now).toISOString().slice(0, 10); // YYYY-MM-DD (UTC)
  }

  // Cola de escritura: serializa todos los updateState del SW (flush + acciones)
  // para que dos ciclos load→modify→save no se pisen y pierdan datos.
  let writeChain: Promise<unknown> = Promise.resolve();
  function enqueueWrite(task: () => Promise<unknown>): Promise<unknown> {
    writeChain = writeChain.then(task, task);
    return writeChain;
  }

  // Efecto de la categoría del sitio sobre la ciudad.
  function grow(city: CityState, category: SiteCategory, elapsed: number): CityState {
    if (category === 'productive') return applyProductiveTime(city, elapsed);
    if (category === 'distracting') return applyDistractingTime(city, elapsed);
    return city;
  }

  // Persiste el tiempo transcurrido en el dominio activo y resetea el contador.
  function flush(now: number): Promise<unknown> {
    if (!activeDomain || paused || activeSince === 0) {
      activeSince = now;
      return Promise.resolve();
    }
    const elapsed = Math.floor((now - activeSince) / 1000);
    activeSince = now;
    if (elapsed <= 0) return Promise.resolve();

    const day = todayStr(now);
    const domain = activeDomain;
    return enqueueWrite(() =>
      updateState(day, (state) => {
        const category = classify(domain, state.userRules);
        const today = recordTime(state.today, domain, category, elapsed);
        const city = grow(state.city, category, elapsed);
        return { ...state, today, city };
      }),
    );
  }

  // Cierra el período anterior y empieza a contar el dominio de la tab activa.
  async function setActiveTab(now: number) {
    const [tab] = await browser.tabs.query({ active: true, lastFocusedWindow: true });
    await flush(now);
    activeDomain = tab?.url ? domainFromUrl(tab.url) : '';
    activeSince = now;
  }

  // Acciones del usuario (popup). Pasan por la misma cola de escritura.
  function handleAction(action: CityAction): Promise<unknown> {
    if (!action || (action.type !== 'BUY_BUILDING' && action.type !== 'REPAIR')) {
      return Promise.resolve();
    }
    const day = todayStr(Date.now());
    return enqueueWrite(() =>
      updateState(day, (state) => {
        if (action.type === 'BUY_BUILDING') {
          return { ...state, city: buyBuilding(state.city) };
        }
        const coins = typeof action.coins === 'number' ? action.coins : 0;
        return { ...state, city: repair(state.city, coins) };
      }),
    );
  }

  browser.runtime.onMessage.addListener((message: CityAction) => {
    void handleAction(message);
  });

  browser.tabs.onActivated.addListener(() => void setActiveTab(Date.now()));
  browser.tabs.onUpdated.addListener((_id, changeInfo, tab) => {
    if (changeInfo.url && tab.active) void setActiveTab(Date.now());
  });
  browser.windows.onFocusChanged.addListener((windowId) => {
    const now = Date.now();
    if (windowId === browser.windows.WINDOW_ID_NONE) {
      void flush(now);
      paused = true;
    } else {
      paused = false;
      void setActiveTab(now);
    }
  });

  // Idle: pausa el conteo cuando el usuario se inactiva o bloquea la pantalla.
  void loadState(todayStr(Date.now())).then((state) => {
    browser.idle.setDetectionInterval(state.settings.idleThresholdSeconds);
  });
  browser.idle.onStateChanged.addListener((newState) => {
    const now = Date.now();
    if (newState === 'active') {
      paused = false;
      void setActiveTab(now);
    } else {
      void flush(now);
      paused = true;
    }
  });

  // Flush periódico: el SW puede dormirse; la alarma lo despierta para persistir.
  browser.alarms.create('flush', { periodInMinutes: 1 });
  browser.alarms.onAlarm.addListener((alarm) => {
    if (alarm.name === 'flush') void flush(Date.now());
  });

  void setActiveTab(Date.now());
});
```

- [ ] **Step 2: Verificar compile + build**

Run:
```bash
npm run compile
npm run build
```
Expected: `tsc` sin errores; `wxt build` genera `.output/chrome-mv3/`.

- [ ] **Step 3: Verificación manual (cargar la extensión)**

1. `npm run dev` (WXT abre Chrome con la extensión), o `npm run build` + cargar `.output/chrome-mv3/` en `chrome://extensions` (modo desarrollador → "Cargar descomprimida").
2. Completar el onboarding marcando, por ej., `github.com` como productivo y `youtube.com` como distractor.
3. Navegar ~30s por `github.com`, luego ~30s por `youtube.com`.
4. Abrir el service worker (link "service worker" en la card) → consola sin errores. Correr:
   ```js
   chrome.storage.local.get('renoria_state').then(console.log)
   ```
   Expected: `today.productiveSeconds > 0`, `today.distractingSeconds > 0`, `city.coins > 0`, `city.condition < 100`.
5. En la consola del SW, probar una acción:
   ```js
   chrome.runtime.sendMessage({ type: 'BUY_BUILDING' })
   chrome.storage.local.get('renoria_state').then((r) => console.log(r.renoria_state.city))
   ```
   Expected: si había monedas suficientes, `coins` bajó y `buildings` subió.

- [ ] **Step 4: Commit**

```bash
git add entrypoints/background.ts
git commit -m "feat(background): service worker de tracking + economía + acciones"
```

---

## Task 6: Popup — balance gastable, ruina por condición, botones (`Home.tsx`)

**Files:**
- Modify: `entrypoints/popup/Home.tsx`

> El popup manda acciones por mensaje (no escribe estado). `browser` está auto-importado por WXT. El render no se unit-testea (depende de WebGL/Chrome); se verifica manual.

- [ ] **Step 1: Agregar imports al inicio de `Home.tsx`**

Debajo de la línea `import { formatDuration } from '../../components/format';`, agregar:

```ts
import type { CityAction } from '../../core/types';
import { buildingCost, canBuy, repairCost } from '../../core/economy';
```

- [ ] **Step 2: Agregar el helper `sendAction` (nivel de módulo, debajo de la función `today` si existiera, o arriba de `export function Home`)**

```ts
function sendAction(action: CityAction) {
  void browser.runtime.sendMessage(action);
}
```

- [ ] **Step 3: Reemplazar el cálculo de las variables derivadas dentro de `Home`**

Reemplazar:

```ts
  const { city, today } = state;
  const focus = today.productiveSeconds + today.distractingSeconds;
  const ruinLevel = focus > 0 ? Math.min(0.4, today.distractingSeconds / focus) : 0.1;
  const points = Math.floor(city.coins);
```

por:

```ts
  const { city, today } = state;
  const ruinLevel = Math.min(1, Math.max(0, 1 - city.condition / 100));
  const points = Math.floor(city.coins);
  const nextCost = buildingCost(city.buildings);
  const toRepair = repairCost(city);
  const repaySpend = Math.min(city.coins, toRepair); // repara lo que alcance hasta 100%
```

- [ ] **Step 4: Insertar la barra de acciones entre el header de puntos y el footer "Today"**

Justo después del `</div>` que cierra el bloque "header / points" (el que contiene "Level {city.level}" y "{city.buildings} buildings") y antes del comentario `{/* footer / today summary */}`, insertar:

```tsx
      {/* actions */}
      <div
        style={{
          position: 'relative',
          zIndex: 3,
          margin: '10px 14px 0',
          display: 'flex',
          gap: 8,
        }}
      >
        <ActionButton
          label={`Construir · ${nextCost}`}
          onClick={() => sendAction({ type: 'BUY_BUILDING' })}
          disabled={!canBuy(city)}
        />
        <ActionButton
          label={`Reparar · ${Math.ceil(repaySpend)}`}
          onClick={() => sendAction({ type: 'REPAIR', coins: repaySpend })}
          disabled={toRepair === 0 || city.coins === 0}
        />
      </div>
```

- [ ] **Step 5: Agregar el componente `ActionButton` al final del archivo (junto a `Stat`)**

```tsx
function ActionButton({
  label,
  onClick,
  disabled,
}: {
  label: string;
  onClick: () => void;
  disabled: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        flex: 1,
        padding: '10px 12px',
        borderRadius: 12,
        border: '1px solid oklch(1 0 0 / 0.5)',
        background: disabled ? 'oklch(0.9 0.02 150 / 0.5)' : 'oklch(0.99 0.01 150 / 0.92)',
        color: disabled ? 'oklch(0.6 0.02 158)' : INK,
        fontFamily: FONT_DISPLAY,
        fontWeight: 800,
        fontSize: 14,
        cursor: disabled ? 'default' : 'pointer',
        fontVariantNumeric: 'tabular-nums',
      }}
    >
      {label}
    </button>
  );
}
```

- [ ] **Step 6: Verificar compile + tests + build**

Run:
```bash
npm run compile
npm run test
npm run build
```
Expected: `tsc` sin errores; todos los tests PASS (incluye `popup-gate`, que renderiza `Home`: `CityCanvas` no monta en jsdom pero el `try/catch` lo absorbe, y los botones renderizan); `wxt build` OK.

- [ ] **Step 7: Verificación manual del popup**

1. `npm run dev` y completar el onboarding.
2. Navegar por un sitio productivo hasta acumular monedas; abrir el popup → "RENORIA POINTS" refleja el balance.
3. Click en **Construir** → el balance baja por `nextCost`, sube `buildings`/`Level`, y el costo del próximo edificio se duplica. El botón se deshabilita si no alcanza.
4. Navegar por un distractor → al reabrir el popup, la ciudad se ve más en ruinas (`ruinLevel` sube).
5. Click en **Reparar** → la condición sube (menos ruina) y el balance baja; con pocas monedas, repara parcialmente.

- [ ] **Step 8: Commit**

```bash
git add entrypoints/popup/Home.tsx
git commit -m "feat(popup): balance gastable, ruina por condición y botones construir/reparar"
```

---

## Task 7: Smoke test end-to-end + calidad

**Files:** ninguno (verificación)

- [ ] **Step 1: Build limpio y carga**

Run: `npm run build`
Cargar `.output/chrome-mv3/` en `chrome://extensions`, o `npm run dev`.

- [ ] **Step 2: Verificar el loop completo de economía**

1. Onboarding: marcar un sitio productivo y uno distractor.
2. Navegar ~1 min productivo → el balance sube en el popup.
3. Construir un edificio → balance baja, `Level`/`buildings` suben.
4. Navegar ~1 min distractor → la ciudad se deteriora (más ruina).
5. Reparar → la ruina baja, el balance baja.
6. Dejar el equipo inactivo > 1 min (umbral idle) → ni el balance ni la condición cambian.

Expected: el loop ganar → gastar → dañar → reparar funciona y se refleja en vivo en el popup.

- [ ] **Step 3: Verificación final de calidad**

Run:
```bash
npm run lint
npm run compile
npm run test
```
Expected: lint sin errores, `tsc` limpio, todos los tests PASS.

- [ ] **Step 4: Commit final (si hubo ajustes)**

```bash
git add -A
git commit -m "chore: verificación end-to-end de la economía"
```

---

## Notas de alcance (diferido, según el spec)

- **Catálogo tipado de edificios** — hoy `buildings` es un contador abstracto; el seam (`buildingCost`/`buyBuilding`) queda listo para el cambio.
- **Selector de monto explícito para reparación parcial** — el MVP repara "lo que alcance hasta 100%".
- **Cola de escritura más robusta** (lock con reintento) — el promise-chain del MVP alcanza.
- **Afinar el balance** (`core/balance.ts`) con datos reales.
- **Sync entre dispositivos** y publicación multi-navegador.
