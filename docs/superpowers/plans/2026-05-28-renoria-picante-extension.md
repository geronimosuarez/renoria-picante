# Renoria Picante — Plan de implementación (MVP)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Construir el MVP de una extensión de Chrome (Manifest V3) que rastrea pasivamente el tiempo de navegación por dominio, lo clasifica como productivo/distractor/neutral, y convierte el foco productivo en el crecimiento de una "ciudad" mostrada en el popup.

**Architecture:** Núcleo puro de TypeScript (`core/`) sin dependencias de Chrome ni React, fácil de testear con Vitest. El service worker es el único que escribe estado (en `chrome.storage.local`); el popup React solo lee y se suscribe a cambios. El render visual de la ciudad es un componente placeholder enchufable (`CityView`) que consume `CityState` como dato.

**Tech Stack:** WXT (sobre Vite) + React + TypeScript · Vitest (+ `fakeBrowser` de WXT) · ESLint + Prettier · Manifest V3.

**Spec de referencia:** `docs/superpowers/specs/2026-05-28-renoria-picante-chrome-extension-design.md`

**Convención:** todos los comandos asumen el directorio raíz del repo. Trabajar en la rama `spec/chrome-extension-design` (ya existe) o una rama de feature derivada.

---

## Estructura de archivos

| Archivo | Responsabilidad |
|---|---|
| `wxt.config.ts` | Config de WXT: manifest V3, permisos, módulo React |
| `package.json` / `tsconfig.json` / `vitest.config.ts` | Tooling y scripts |
| `eslint.config.js` / `.prettierrc` | Calidad de código |
| `core/types.ts` | Contrato compartido de tipos (puro) |
| `core/defaults.ts` | Reglas de categoría por defecto + factories de estado inicial |
| `core/classifier.ts` | `domainFromUrl`, `classify` (puro) |
| `core/growth.ts` | `applyFocusTime` y curva de crecimiento (puro) |
| `core/tracker.ts` | `recordTime`: acumulación de tiempo por dominio (puro) |
| `storage/storage.ts` | Wrapper tipado sobre `chrome.storage.local` + rollover de día |
| `entrypoints/background.ts` | Service worker: cablea eventos de Chrome → core → storage |
| `components/format.ts` | `formatDuration` (puro) |
| `components/FocusStats.tsx` | Muestra stats del día (presentacional) |
| `components/CityView.tsx` | Placeholder del render de la ciudad |
| `entrypoints/popup/{index.html,main.tsx,App.tsx,style.css}` | UI del popup |
| `tests/*.test.ts(x)` | Tests de Vitest |

---

## Task 1: Scaffold, tooling y manifest

**Files:**
- Create: `package.json`, `tsconfig.json`, `wxt.config.ts`, `vitest.config.ts`, `eslint.config.js`, `.prettierrc`, `.gitignore`
- Create: `entrypoints/background.ts` (stub temporal para que el build valide)

- [ ] **Step 1: Inicializar `package.json` e instalar dependencias**

```bash
npm init -y
npm install react react-dom
npm install -D wxt @wxt-dev/module-react typescript @types/react @types/react-dom \
  vitest jsdom @testing-library/react \
  eslint @eslint/js typescript-eslint eslint-plugin-react-hooks prettier
```

- [ ] **Step 2: Reemplazar la sección `scripts` de `package.json`**

Editar `package.json` para que `scripts` y `type` queden así (mantené `name`, `version`, etc.):

```json
{
  "type": "module",
  "scripts": {
    "dev": "wxt",
    "build": "wxt build",
    "zip": "wxt zip",
    "compile": "tsc --noEmit",
    "lint": "eslint .",
    "format": "prettier --write .",
    "test": "vitest run --passWithNoTests",
    "test:watch": "vitest",
    "postinstall": "wxt prepare"
  }
}
```

- [ ] **Step 3: Crear `wxt.config.ts` con el manifest V3 y permisos**

```ts
import { defineConfig } from 'wxt';

// https://wxt.dev/api/config.html
export default defineConfig({
  modules: ['@wxt-dev/module-react'],
  manifest: {
    name: 'Renoria Picante',
    description: 'Una ciudad que crece con tu foco.',
    // storage: persistir estado | tabs: leer URL de la tab activa
    // idle: pausar al inactivar | alarms: flush periódico con el SW dormido
    permissions: ['storage', 'tabs', 'idle', 'alarms'],
  },
});
```

- [ ] **Step 4: Crear `tsconfig.json` (extiende el generado por WXT)**

```json
{
  "extends": "./.wxt/tsconfig.json",
  "compilerOptions": {
    "jsx": "react-jsx",
    "strict": true
  }
}
```

- [ ] **Step 5: Crear `vitest.config.ts`**

```ts
import { defineConfig } from 'vitest/config';
import { WxtVitest } from 'wxt/testing';

// WxtVitest habilita auto-imports de WXT y mockea `browser` con fakeBrowser.
export default defineConfig({
  plugins: [WxtVitest()],
  test: {
    environment: 'jsdom',
    globals: true,
  },
});
```

- [ ] **Step 6: Crear `eslint.config.js` (flat config mínima)**

```js
import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import reactHooks from 'eslint-plugin-react-hooks';

export default tseslint.config(
  { ignores: ['.wxt/**', '.output/**', 'node_modules/**'] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    plugins: { 'react-hooks': reactHooks },
    rules: { ...reactHooks.configs.recommended.rules },
  },
);
```

- [ ] **Step 7: Crear `.prettierrc`**

```json
{
  "semi": true,
  "singleQuote": true,
  "trailingComma": "all",
  "printWidth": 100
}
```

- [ ] **Step 8: Crear `.gitignore`**

```gitignore
node_modules/
.wxt/
.output/
*.log
```

- [ ] **Step 9: Crear `entrypoints/background.ts` (stub)**

```ts
// Stub temporal — se implementa en la Task 7.
// `defineBackground` y `browser` son auto-importados por WXT.
export default defineBackground(() => {
  console.log('Renoria Picante background activo');
});
```

- [ ] **Step 10: Generar tipos de WXT y verificar el build**

Run:
```bash
npm run postinstall   # ejecuta `wxt prepare`, genera .wxt/
npm run compile       # tsc --noEmit
npm run build         # wxt build
```
Expected: `wxt prepare` crea `.wxt/`; `tsc` termina sin errores; `wxt build` imprime "Built extension" y genera `.output/chrome-mv3/`.

- [ ] **Step 11: Commit**

```bash
git add -A
git commit -m "chore: scaffold WXT + React + TS, tooling y manifest V3"
```

---

## Task 2: Contrato de tipos compartido (`core/types.ts`)

**Files:**
- Create: `core/types.ts`

> Este archivo es el contrato que desbloquea los tres frentes de trabajo. No lleva test (son solo tipos); se valida vía `tsc` en tasks siguientes.

- [ ] **Step 1: Crear `core/types.ts`**

```ts
/** Clasificación de un sitio. */
export type SiteCategory = 'productive' | 'distracting' | 'neutral';

/** Regla de clasificación (default del sistema u override del usuario). */
export interface CategoryRule {
  pattern: string; // dominio, ej "youtube.com"
  category: SiteCategory;
}

/** Tiempo acumulado por dominio dentro de un día. */
export interface DomainTime {
  domain: string;
  category: SiteCategory;
  seconds: number;
}

/** Stats de foco de un día. */
export interface FocusStats {
  date: string; // YYYY-MM-DD
  productiveSeconds: number;
  distractingSeconds: number;
  neutralSeconds: number;
  byDomain: DomainTime[];
}

/** Estado de la ciudad — agnóstico al render. */
export interface CityState {
  growthPoints: number; // puntos acumulados de foco productivo
  level: number; // etapa de la ciudad
  buildings: number; // elementos desbloqueados (abstracto)
}

/** Estado persistido completo en chrome.storage.local. */
export interface PersistedState {
  city: CityState;
  today: FocusStats;
  history: FocusStats[]; // días previos (más recientes primero)
  userRules: CategoryRule[]; // overrides del usuario
  settings: {
    idleThresholdSeconds: number; // umbral para considerar al usuario inactivo
  };
}
```

- [ ] **Step 2: Verificar que compila**

Run: `npm run compile`
Expected: sin errores.

- [ ] **Step 3: Commit**

```bash
git add core/types.ts
git commit -m "feat(core): contrato de tipos compartido"
```

---

## Task 3: Clasificador de sitios (`core/defaults.ts` + `core/classifier.ts`)

**Files:**
- Create: `core/defaults.ts`
- Create: `core/classifier.ts`
- Test: `tests/classifier.test.ts`

- [ ] **Step 1: Crear `core/defaults.ts`**

```ts
import type { CategoryRule, CityState, FocusStats, PersistedState } from './types';

/** Reglas por defecto (out-of-the-box). El usuario puede sobrescribirlas. */
export const DEFAULT_RULES: CategoryRule[] = [
  { pattern: 'youtube.com', category: 'distracting' },
  { pattern: 'facebook.com', category: 'distracting' },
  { pattern: 'instagram.com', category: 'distracting' },
  { pattern: 'twitter.com', category: 'distracting' },
  { pattern: 'x.com', category: 'distracting' },
  { pattern: 'tiktok.com', category: 'distracting' },
  { pattern: 'reddit.com', category: 'distracting' },
  { pattern: 'netflix.com', category: 'distracting' },
  { pattern: 'github.com', category: 'productive' },
  { pattern: 'stackoverflow.com', category: 'productive' },
  { pattern: 'developer.mozilla.org', category: 'productive' },
  { pattern: 'docs.google.com', category: 'productive' },
  { pattern: 'notion.so', category: 'productive' },
  { pattern: 'linear.app', category: 'productive' },
];

export const DEFAULT_IDLE_THRESHOLD_SECONDS = 60;

export function emptyCity(): CityState {
  return { growthPoints: 0, level: 1, buildings: 0 };
}

export function emptyStats(date: string): FocusStats {
  return {
    date,
    productiveSeconds: 0,
    distractingSeconds: 0,
    neutralSeconds: 0,
    byDomain: [],
  };
}

export function initialState(date: string): PersistedState {
  return {
    city: emptyCity(),
    today: emptyStats(date),
    history: [],
    userRules: [],
    settings: { idleThresholdSeconds: DEFAULT_IDLE_THRESHOLD_SECONDS },
  };
}
```

- [ ] **Step 2: Escribir el test que falla**

Crear `tests/classifier.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { classify, domainFromUrl } from '../core/classifier';

describe('domainFromUrl', () => {
  it('extrae el dominio sin www', () => {
    expect(domainFromUrl('https://www.github.com/foo/bar')).toBe('github.com');
  });
  it('devuelve "" para URLs no http(s)', () => {
    expect(domainFromUrl('chrome://extensions')).toBe('');
  });
  it('devuelve "" para texto inválido', () => {
    expect(domainFromUrl('no es una url')).toBe('');
  });
});

describe('classify', () => {
  it('clasifica un dominio default como productive', () => {
    expect(classify('github.com', [])).toBe('productive');
  });
  it('matchea subdominios del pattern', () => {
    expect(classify('gist.github.com', [])).toBe('productive');
  });
  it('devuelve neutral para dominios desconocidos', () => {
    expect(classify('example.com', [])).toBe('neutral');
  });
  it('los overrides del usuario tienen prioridad sobre los defaults', () => {
    const rules = [{ pattern: 'youtube.com', category: 'productive' as const }];
    expect(classify('youtube.com', rules)).toBe('productive');
  });
});
```

- [ ] **Step 3: Correr el test y verificar que falla**

Run: `npm run test -- classifier`
Expected: FAIL — `Failed to resolve import '../core/classifier'` (el archivo aún no existe).

- [ ] **Step 4: Implementar `core/classifier.ts`**

```ts
import type { CategoryRule, SiteCategory } from './types';
import { DEFAULT_RULES } from './defaults';

/**
 * Extrae el dominio registrable simplificado de una URL.
 * Devuelve '' si no es http(s) (ej: chrome://, about:, file:).
 */
export function domainFromUrl(url: string): string {
  try {
    const u = new URL(url);
    if (u.protocol !== 'http:' && u.protocol !== 'https:') return '';
    return u.hostname.replace(/^www\./, '');
  } catch {
    return '';
  }
}

/**
 * Clasifica un dominio. Los overrides del usuario tienen prioridad sobre los defaults.
 * Un dominio matchea si es igual al pattern o un subdominio de él.
 */
export function classify(domain: string, userRules: CategoryRule[]): SiteCategory {
  if (!domain) return 'neutral';
  const rules = [...userRules, ...DEFAULT_RULES];
  for (const rule of rules) {
    if (domain === rule.pattern || domain.endsWith('.' + rule.pattern)) {
      return rule.category;
    }
  }
  return 'neutral';
}
```

- [ ] **Step 5: Correr los tests y verificar que pasan**

Run: `npm run test -- classifier`
Expected: PASS (7 tests).

- [ ] **Step 6: Commit**

```bash
git add core/defaults.ts core/classifier.ts tests/classifier.test.ts
git commit -m "feat(core): clasificador de sitios y reglas por defecto"
```

---

## Task 4: Motor de crecimiento (`core/growth.ts`)

**Files:**
- Create: `core/growth.ts`
- Test: `tests/growth.test.ts`

- [ ] **Step 1: Escribir el test que falla**

Crear `tests/growth.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { applyFocusTime } from '../core/growth';
import { emptyCity } from '../core/defaults';

describe('applyFocusTime', () => {
  it('no cambia la ciudad con 0 segundos', () => {
    const city = emptyCity();
    expect(applyFocusTime(city, 0)).toEqual(city);
  });
  it('ignora segundos negativos', () => {
    const city = emptyCity();
    expect(applyFocusTime(city, -100)).toEqual(city);
  });
  it('suma 1 punto por minuto de foco productivo', () => {
    const result = applyFocusTime(emptyCity(), 60);
    expect(result.growthPoints).toBe(1);
    expect(result.buildings).toBe(0);
    expect(result.level).toBe(1);
  });
  it('desbloquea 1 edificio cada 5 puntos', () => {
    const result = applyFocusTime(emptyCity(), 300); // 5 min → 5 puntos
    expect(result.buildings).toBe(1);
  });
  it('sube de nivel cada 10 edificios', () => {
    const result = applyFocusTime(emptyCity(), 60 * 50); // 50 min → 50 puntos → 10 edificios
    expect(result.buildings).toBe(10);
    expect(result.level).toBe(2);
  });
});
```

- [ ] **Step 2: Correr el test y verificar que falla**

Run: `npm run test -- growth`
Expected: FAIL — no se puede resolver `'../core/growth'`.

- [ ] **Step 3: Implementar `core/growth.ts`**

```ts
import type { CityState } from './types';

export const SECONDS_PER_POINT = 60; // 1 punto por minuto de foco productivo
export const POINTS_PER_BUILDING = 5; // cada 5 puntos → 1 edificio
export const BUILDINGS_PER_LEVEL = 10; // cada 10 edificios → sube de nivel

/**
 * Convierte segundos de foco productivo en crecimiento de la ciudad.
 * Devuelve una copia nueva de CityState (no muta).
 */
export function applyFocusTime(city: CityState, productiveSeconds: number): CityState {
  if (productiveSeconds <= 0) return city;
  const growthPoints = city.growthPoints + productiveSeconds / SECONDS_PER_POINT;
  const buildings = Math.floor(growthPoints / POINTS_PER_BUILDING);
  const level = Math.floor(buildings / BUILDINGS_PER_LEVEL) + 1;
  return { growthPoints, buildings, level };
}
```

- [ ] **Step 4: Correr los tests y verificar que pasan**

Run: `npm run test -- growth`
Expected: PASS (5 tests).

- [ ] **Step 5: Commit**

```bash
git add core/growth.ts tests/growth.test.ts
git commit -m "feat(core): motor de crecimiento de la ciudad"
```

---

## Task 5: Acumulación de tiempo (`core/tracker.ts`)

**Files:**
- Create: `core/tracker.ts`
- Test: `tests/tracker.test.ts`

- [ ] **Step 1: Escribir el test que falla**

Crear `tests/tracker.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { recordTime } from '../core/tracker';
import { emptyStats } from '../core/defaults';

describe('recordTime', () => {
  it('suma tiempo productivo a las stats y al dominio', () => {
    const result = recordTime(emptyStats('2026-05-28'), 'github.com', 'productive', 30);
    expect(result.productiveSeconds).toBe(30);
    expect(result.byDomain).toEqual([{ domain: 'github.com', category: 'productive', seconds: 30 }]);
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

- [ ] **Step 2: Correr el test y verificar que falla**

Run: `npm run test -- tracker`
Expected: FAIL — no se puede resolver `'../core/tracker'`.

- [ ] **Step 3: Implementar `core/tracker.ts`**

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

- [ ] **Step 4: Correr los tests y verificar que pasan**

Run: `npm run test -- tracker`
Expected: PASS (5 tests).

- [ ] **Step 5: Commit**

```bash
git add core/tracker.ts tests/tracker.test.ts
git commit -m "feat(core): acumulación de tiempo por dominio"
```

---

## Task 6: Capa de storage (`storage/storage.ts`)

**Files:**
- Create: `storage/storage.ts`
- Test: `tests/storage.test.ts`

> Usa `browser.storage.local` (auto-importado por WXT; mapea a `chrome.storage.local`). Los tests usan `fakeBrowser` de WXT, un `browser` en memoria.

- [ ] **Step 1: Escribir el test que falla**

Crear `tests/storage.test.ts`:

```ts
import { beforeEach, describe, expect, it } from 'vitest';
import { fakeBrowser } from 'wxt/testing';
import { loadState, rollover, saveState, updateState } from '../storage/storage';
import { initialState } from '../core/defaults';

beforeEach(() => {
  fakeBrowser.reset();
});

describe('loadState', () => {
  it('devuelve el estado inicial cuando no hay nada guardado', async () => {
    const state = await loadState('2026-05-28');
    expect(state).toEqual(initialState('2026-05-28'));
  });
  it('persiste y recupera el estado', async () => {
    const next = await updateState('2026-05-28', (s) => ({
      ...s,
      today: { ...s.today, productiveSeconds: 120 },
    }));
    expect(next.today.productiveSeconds).toBe(120);
    const reloaded = await loadState('2026-05-28');
    expect(reloaded.today.productiveSeconds).toBe(120);
  });
});

describe('rollover', () => {
  it('archiva el día anterior en history si la fecha cambió', () => {
    const state = initialState('2026-05-27');
    state.today.productiveSeconds = 300;
    const result = rollover(state, '2026-05-28');
    expect(result.today.date).toBe('2026-05-28');
    expect(result.today.productiveSeconds).toBe(0);
    expect(result.history[0].productiveSeconds).toBe(300);
  });
  it('no toca nada si la fecha es la misma', () => {
    const state = initialState('2026-05-28');
    expect(rollover(state, '2026-05-28')).toBe(state);
  });
});
```

- [ ] **Step 2: Correr el test y verificar que falla**

Run: `npm run test -- storage`
Expected: FAIL — no se puede resolver `'../storage/storage'`.

- [ ] **Step 3: Implementar `storage/storage.ts`**

```ts
import type { PersistedState } from '../core/types';
import { emptyStats, initialState } from '../core/defaults';

const STORAGE_KEY = 'renoria_state';

/** Si el día guardado no es hoy, archiva `today` en history y arranca un día nuevo. */
export function rollover(state: PersistedState, today: string): PersistedState {
  if (state.today.date === today) return state;
  return {
    ...state,
    today: emptyStats(today),
    history: [state.today, ...state.history].slice(0, 30),
  };
}

export async function loadState(today: string): Promise<PersistedState> {
  const result = await browser.storage.local.get(STORAGE_KEY);
  const stored = result[STORAGE_KEY] as PersistedState | undefined;
  if (!stored) return initialState(today);
  return rollover(stored, today);
}

export async function saveState(state: PersistedState): Promise<void> {
  await browser.storage.local.set({ [STORAGE_KEY]: state });
}

/** Carga, aplica el updater y persiste. Devuelve el estado nuevo. */
export async function updateState(
  today: string,
  updater: (state: PersistedState) => PersistedState,
): Promise<PersistedState> {
  const current = await loadState(today);
  const next = updater(current);
  await saveState(next);
  return next;
}

/** Suscribe a cambios del estado. Devuelve una función para desuscribir. */
export function subscribe(callback: (state: PersistedState) => void): () => void {
  const listener = (
    changes: Record<string, { newValue?: unknown }>,
    area: string,
  ) => {
    if (area === 'local' && changes[STORAGE_KEY]?.newValue) {
      callback(changes[STORAGE_KEY].newValue as PersistedState);
    }
  };
  browser.storage.onChanged.addListener(listener);
  return () => browser.storage.onChanged.removeListener(listener);
}
```

- [ ] **Step 4: Correr los tests y verificar que pasan**

Run: `npm run test -- storage`
Expected: PASS (4 tests).

- [ ] **Step 5: Commit**

```bash
git add storage/storage.ts tests/storage.test.ts
git commit -m "feat(storage): wrapper tipado sobre chrome.storage.local + rollover"
```

---

## Task 7: Service worker de tracking (`entrypoints/background.ts`)

**Files:**
- Modify: `entrypoints/background.ts` (reemplaza el stub de la Task 1)

> Es código de cableado (glue) de eventos de Chrome con los módulos ya testeados. La verificación es manual cargando la extensión, porque depende de APIs del navegador. Toda la lógica no trivial ya está cubierta por tests en `core/` y `storage/`.

- [ ] **Step 1: Reemplazar el contenido de `entrypoints/background.ts`**

```ts
import { classify, domainFromUrl } from '../core/classifier';
import { recordTime } from '../core/tracker';
import { applyFocusTime } from '../core/growth';
import { loadState, updateState } from '../storage/storage';

// `defineBackground` y `browser` son auto-importados por WXT.
export default defineBackground(() => {
  let activeDomain = '';
  let activeSince = 0; // timestamp ms del último cambio
  let paused = false;

  function todayStr(now: number): string {
    return new Date(now).toISOString().slice(0, 10); // YYYY-MM-DD (UTC)
  }

  // Persiste el tiempo transcurrido en el dominio activo y resetea el contador.
  async function flush(now: number) {
    if (!activeDomain || paused || activeSince === 0) {
      activeSince = now;
      return;
    }
    const elapsed = Math.floor((now - activeSince) / 1000);
    activeSince = now;
    if (elapsed <= 0) return;

    const day = todayStr(now);
    const domain = activeDomain;
    await updateState(day, (state) => {
      const category = classify(domain, state.userRules);
      const today = recordTime(state.today, domain, category, elapsed);
      const city =
        category === 'productive' ? applyFocusTime(state.city, elapsed) : state.city;
      return { ...state, today, city };
    });
  }

  // Cierra el período anterior y empieza a contar el dominio de la tab activa.
  async function setActiveTab(now: number) {
    const [tab] = await browser.tabs.query({ active: true, lastFocusedWindow: true });
    await flush(now);
    activeDomain = tab?.url ? domainFromUrl(tab.url) : '';
    activeSince = now;
  }

  browser.tabs.onActivated.addListener(() => setActiveTab(Date.now()));
  browser.tabs.onUpdated.addListener((_id, changeInfo, tab) => {
    if (changeInfo.url && tab.active) setActiveTab(Date.now());
  });
  browser.windows.onFocusChanged.addListener((windowId) => {
    const now = Date.now();
    if (windowId === browser.windows.WINDOW_ID_NONE) {
      flush(now);
      paused = true;
    } else {
      paused = false;
      setActiveTab(now);
    }
  });

  // Idle: pausa el conteo cuando el usuario se inactiva o bloquea la pantalla.
  loadState(todayStr(Date.now())).then((state) => {
    browser.idle.setDetectionInterval(state.settings.idleThresholdSeconds);
  });
  browser.idle.onStateChanged.addListener((newState) => {
    const now = Date.now();
    if (newState === 'active') {
      paused = false;
      setActiveTab(now);
    } else {
      flush(now);
      paused = true;
    }
  });

  // Flush periódico: el SW puede dormirse; la alarma lo despierta para persistir.
  browser.alarms.create('flush', { periodInMinutes: 1 });
  browser.alarms.onAlarm.addListener((alarm) => {
    if (alarm.name === 'flush') flush(Date.now());
  });

  setActiveTab(Date.now());
});
```

- [ ] **Step 2: Verificar que compila y buildea**

Run:
```bash
npm run compile
npm run build
```
Expected: `tsc` sin errores; `wxt build` genera `.output/chrome-mv3/`.

- [ ] **Step 3: Verificación manual (cargar la extensión)**

1. `npm run dev` (WXT abre Chrome con la extensión cargada), o build + cargar manual:
   - Ir a `chrome://extensions`, activar "Modo de desarrollador".
   - "Cargar descomprimida" → seleccionar `.output/chrome-mv3/`.
2. Navegar ~30s por `github.com`, luego ~30s por `youtube.com`.
3. Abrir el service worker (link "service worker" en la card de la extensión) → consola sin errores.
4. En la consola del SW correr:
   ```js
   chrome.storage.local.get('renoria_state').then(console.log)
   ```
   Expected: `today.productiveSeconds > 0`, `today.distractingSeconds > 0`, `city.growthPoints > 0`.

- [ ] **Step 4: Commit**

```bash
git add entrypoints/background.ts
git commit -m "feat(background): service worker de tracking pasivo"
```

---

## Task 8: UI del popup

**Files:**
- Create: `components/format.ts`
- Create: `components/FocusStats.tsx`
- Create: `components/CityView.tsx`
- Create: `entrypoints/popup/index.html`
- Create: `entrypoints/popup/main.tsx`
- Create: `entrypoints/popup/App.tsx`
- Create: `entrypoints/popup/style.css`
- Test: `tests/format.test.ts`, `tests/focus-stats.test.tsx`

- [ ] **Step 1: Escribir el test que falla para `formatDuration`**

Crear `tests/format.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { formatDuration } from '../components/format';

describe('formatDuration', () => {
  it('formatea 0 como 0m', () => {
    expect(formatDuration(0)).toBe('0m');
  });
  it('formatea segundos sueltos como minutos', () => {
    expect(formatDuration(90)).toBe('1m');
  });
  it('formatea horas exactas', () => {
    expect(formatDuration(3600)).toBe('1h 0m');
  });
  it('formatea horas y minutos', () => {
    expect(formatDuration(3661)).toBe('1h 1m');
  });
});
```

- [ ] **Step 2: Correr el test y verificar que falla**

Run: `npm run test -- format`
Expected: FAIL — no se puede resolver `'../components/format'`.

- [ ] **Step 3: Implementar `components/format.ts`**

```ts
/** Formatea segundos como "Xh Ym" o "Ym". */
export function formatDuration(seconds: number): string {
  const totalMinutes = Math.floor(seconds / 60);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
}
```

- [ ] **Step 4: Correr los tests y verificar que pasan**

Run: `npm run test -- format`
Expected: PASS (4 tests).

- [ ] **Step 5: Implementar `components/CityView.tsx` (placeholder)**

```tsx
import type { CityState } from '../core/types';

// PLACEHOLDER: el render visual real de la ciudad se define más adelante.
// Este componente consume CityState como dato; al definir el arte, solo se cambia esto.
export function CityView({ city }: { city: CityState }) {
  return (
    <div className="city-view" aria-label="Tu ciudad">
      <div className="city-placeholder" role="img" aria-label="ciudad">
        🏙️
      </div>
      <p className="city-meta">
        Nivel {city.level} · {city.buildings} edificios
      </p>
    </div>
  );
}
```

- [ ] **Step 6: Implementar `components/FocusStats.tsx`**

```tsx
import type { FocusStats as Stats } from '../core/types';
import { formatDuration } from './format';

export function FocusStats({ stats }: { stats: Stats }) {
  return (
    <div className="focus-stats">
      <p>Productivo: {formatDuration(stats.productiveSeconds)}</p>
      <p>Distracción: {formatDuration(stats.distractingSeconds)}</p>
      <p>Neutral: {formatDuration(stats.neutralSeconds)}</p>
    </div>
  );
}
```

- [ ] **Step 7: Escribir el test de render de `FocusStats`**

Crear `tests/focus-stats.test.tsx`:

```tsx
import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { FocusStats } from '../components/FocusStats';
import { emptyStats } from '../core/defaults';

describe('FocusStats', () => {
  it('muestra el tiempo productivo formateado', () => {
    const stats = { ...emptyStats('2026-05-28'), productiveSeconds: 3661 };
    render(<FocusStats stats={stats} />);
    expect(screen.getByText('Productivo: 1h 1m')).toBeTruthy();
  });
});
```

- [ ] **Step 8: Correr el test y verificar que pasa**

Run: `npm run test -- focus-stats`
Expected: PASS (1 test). (El componente ya existe del Step 6, así que pasa directo.)

- [ ] **Step 9: Crear `entrypoints/popup/App.tsx`**

```tsx
import { useEffect, useState } from 'react';
import type { PersistedState } from '../../core/types';
import { loadState, subscribe } from '../../storage/storage';
import { CityView } from '../../components/CityView';
import { FocusStats } from '../../components/FocusStats';

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

export function App() {
  const [state, setState] = useState<PersistedState | null>(null);

  useEffect(() => {
    loadState(today()).then(setState);
    const unsubscribe = subscribe(setState);
    return unsubscribe;
  }, []);

  if (!state) return <div className="popup">Cargando…</div>;

  return (
    <div className="popup">
      <CityView city={state.city} />
      <FocusStats stats={state.today} />
    </div>
  );
}
```

- [ ] **Step 10: Crear `entrypoints/popup/main.tsx`**

```tsx
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';
import './style.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
```

- [ ] **Step 11: Crear `entrypoints/popup/index.html`**

```html
<!doctype html>
<html lang="es">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Renoria Picante</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="./main.tsx"></script>
  </body>
</html>
```

- [ ] **Step 12: Crear `entrypoints/popup/style.css`**

```css
:root {
  color-scheme: light dark;
}
body {
  width: 320px;
  margin: 0;
  font-family: system-ui, sans-serif;
}
.popup {
  padding: 16px;
}
.city-view {
  text-align: center;
}
.city-placeholder {
  font-size: 64px;
}
.city-meta {
  font-weight: 600;
}
.focus-stats {
  margin-top: 12px;
  font-size: 14px;
}
.focus-stats p {
  margin: 4px 0;
}
```

- [ ] **Step 13: Verificar build + tests + compile**

Run:
```bash
npm run compile
npm run test
npm run build
```
Expected: `tsc` sin errores; todos los tests PASS; `wxt build` OK.

- [ ] **Step 14: Commit**

```bash
git add components/ entrypoints/popup/ tests/format.test.ts tests/focus-stats.test.tsx
git commit -m "feat(popup): UI con stats del día y placeholder de la ciudad"
```

---

## Task 9: Smoke test end-to-end

**Files:** ninguno (verificación manual integrada)

- [ ] **Step 1: Build limpio y carga**

Run:
```bash
npm run build
```
Cargar `.output/chrome-mv3/` en `chrome://extensions` (modo desarrollador → "Cargar descomprimida"), o usar `npm run dev`.

- [ ] **Step 2: Verificar el loop completo**

1. Navegar ~1 min por sitios productivos (ej: `github.com`) y ~1 min por distractores (ej: `youtube.com`).
2. Click en el ícono de la extensión → se abre el popup.
3. Verificar que el popup muestra:
   - "Productivo" y "Distracción" con tiempos > 0.
   - "Nivel" y cantidad de "edificios" coherentes con el tiempo productivo.
4. Dejar el equipo inactivo > 1 min (umbral idle) → el tiempo no debe seguir subiendo.

Expected: los números reflejan la navegación real y se actualizan al reabrir el popup.

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
git commit -m "chore: verificación end-to-end del MVP"
```

---

## Notas de alcance (diferido, según el spec)

- **Render visual real de la ciudad** — `CityView` queda como placeholder.
- **Options page para editar categorías** — el modelo soporta `userRules`, pero la UI de edición es una iteración posterior; el MVP usa los defaults.
- **Sync entre dispositivos** y **publicación multi-navegador**.
- **Afinar el balance de crecimiento** (`SECONDS_PER_POINT`, etc.) con datos reales tras el MVP.
