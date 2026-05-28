# Economía de puntuación — Monedas, ciudad y condición — Diseño

**Fecha:** 2026-05-28
**Estado:** Aprobado para escribir plan de implementación
**Specs base:**
- `docs/superpowers/specs/2026-05-28-renoria-picante-chrome-extension-design.md`
- `docs/superpowers/specs/2026-05-28-classifier-onboarding-design.md`

## Relación con los specs previos y con el estado de `main`

El spec base dejó **pausado** `core/growth` y difirió "el detalle del balance de crecimiento". El spec de clasificación lo confirmó como fuera de alcance. **Este documento retoma y reemplaza ese trabajo.**

Cambio conceptual clave: la ciudad **ya no crece sola** acumulando `growthPoints`. Ahora hay una **economía**: el foco productivo da **puntos/monedas gastables** (un único balance), y la ciudad crece **porque el usuario gasta ese balance** en construir. El módulo se llama `core/economy.ts`.

**Estado real de `main` al escribir este spec** (revisado contra el código mergeado):

- ✅ Ya existen: `core/classifier.ts` (clasificación 100% user-driven), `core/curated.ts`, `core/onboarding.ts`, `storage/storage.ts` (con `updateState` / `subscribe` / `rollover`), el onboarding completo, y un **render real de la ciudad en three.js** (`components/renoria/CityCanvas.tsx` → `createCity.ts`).
- ✅ `CityCanvas` ya recibe un prop **`ruinLevel` (0..1 = proporción de edificios en ruina)** → el concepto de "condición/ruina" **ya existe en el render**.
- ✅ `entrypoints/popup/Home.tsx` muestra un número grande "RENORIA POINTS" (`city.growthPoints`), `Level`, `buildings` y el resumen del día.
- ❌ **No existe el tracking todavía:** `entrypoints/background.ts` es un **stub**. No hay `core/tracker.ts` ni motor de crecimiento. **Por lo tanto este plan también construye el tracking del service worker**, no solo la economía pura.

---

## 1. El loop central

```
foco productivo ──► ganás monedas (balance gastable = "RENORIA POINTS")
        │
        ▼
   gastás monedas ──► comprar edificios/mejoras (la ciudad crece)
        │           └► reparar la condición (compite por las mismas monedas)
        ▼
tiempo en distractores ──► baja la CONDICIÓN de la ciudad (0–100%)
tiempo neutral / idle ──► no hace nada
```

- **Productivo** → suma monedas. **Distractor** → baja la condición. **Neutral / idle** → nada.
- La condición **no afecta el ingreso de monedas** (sin espiral): es presión estética (más ruina en el render) y una decisión de gasto (reparar vs. construir).

---

## 2. Decisiones de producto (output del brainstorm)

| Decisión | Elegido |
|---|---|
| Naturaleza de la puntuación | **Economía de un único balance gastable** ("puntos" = monedas) |
| ¿El balance baja al gastar? | **Sí.** El número grande del popup es el balance y baja al construir/reparar |
| Qué da monedas | **Solo el tiempo productivo** |
| Efecto de los distractores | **Dañan la ciudad** bajando un medidor de **condición 0–100%** |
| Efecto de los neutrales | **Nada** |
| Granularidad del daño | **Medidor único a nivel ciudad** (no por edificio) → alimenta `ruinLevel` |
| ¿La condición baja penaliza el ingreso? | **No.** Solo es presión estética / decisión de gasto |
| Reparación | **Manual** (la dispara el usuario) y **parcial** (gasta lo que quiera/pueda) |
| Modelo de edificios | **Abstracto ahora** (contador con costo creciente); **catálogo tipado = evolución planificada** |

---

## 3. Cambios al modelo de datos (`core/types.ts`)

El `CityState` actual (`growthPoints` / `level` / `buildings`) se reemplaza:

```ts
/** Estado de la ciudad — agnóstico al render. */
export interface CityState {
  coins: number;       // balance gastable (float; la UI lo muestra floor)
  buildings: number;   // edificios comprados (abstracto; ver §9 evolución)
  level: number;       // derivado de buildings (función pura)
  condition: number;   // 0–100, salud de la ciudad (float; alimenta ruinLevel)
}
```

- `coins` es un **acumulador float** (la tasa por segundo es fraccionaria). Se muestra `Math.floor(coins)`. Gastar requiere `costo <= coins`.
- `condition` es float 0–100, arranca en **100**.
- `FocusStats` **no cambia**: ya trae `productiveSeconds` / `distractingSeconds` / `neutralSeconds`. La economía consume **deltas** de esos segundos por tick (no el acumulado del día).

Estado inicial de `CityState`: `{ coins: 0, buildings: 0, level: 1, condition: 100 }` (en `core/defaults.ts → emptyCity()`).

Nuevo tipo para las acciones que el popup le pide al service worker:

```ts
export type CityAction =
  | { type: 'BUY_BUILDING' }
  | { type: 'REPAIR'; coins: number };  // monedas a gastar (reparación parcial)
```

Consumidores de `growthPoints` a migrar (relevamiento sobre `main`): `core/types.ts` (definición), `core/defaults.ts` (`emptyCity`), `entrypoints/popup/Home.tsx` (display).

---

## 4. Lógica pura (`core/economy.ts`)

Funciones puras, sin Chrome ni React → testeables directo con Vitest. Reciben y devuelven `CityState` (inmutable: copia nueva).

| Función | Firma | Semántica |
|---|---|---|
| Ingreso | `applyProductiveTime(city, deltaSeconds): CityState` | `coins += deltaSeconds * COINS_PER_PRODUCTIVE_MINUTE / 60` |
| Daño | `applyDistractingTime(city, deltaSeconds): CityState` | `condition = max(0, condition - deltaSeconds * CONDITION_LOSS_PER_DISTRACTING_MINUTE / 60)` |
| Costo edificio | `buildingCost(buildings): number` | `BASE_BUILDING_COST * 2 ** buildings` (10, 20, 40, 80…) |
| ¿Puede comprar? | `canBuy(city): boolean` | `coins >= buildingCost(buildings)` |
| Comprar | `buyBuilding(city): CityState` | si `canBuy`: `coins -= buildingCost(buildings)`, `buildings += 1`, `level = levelFromBuildings(buildings)`; si no, devuelve `city` igual |
| Nivel | `levelFromBuildings(buildings): number` | `1 + floor(buildings / BUILDINGS_PER_LEVEL)` |
| Costo de reparar a 100% | `repairCost(city): number` | `(100 - condition) * COINS_PER_CONDITION_POINT` |
| Reparar (parcial) | `repair(city, coins): CityState` | gasta `spend = min(coins, city.coins, repairCost(city))`; `condition += spend / COINS_PER_CONDITION_POINT` (tope 100); `coins -= spend` |

Notas:
- `buyBuilding` es **total-or-nothing**. `repair` es **parcial por diseño** y clampa solo (seguro ante valores fuera de rango).
- `emptyCity()` (la factory del estado inicial) vive en `core/defaults.ts` y se actualiza al shape nuevo.

---

## 5. Balance inicial (`core/balance.ts`, **tuneable**)

| Constante | Default | Significado |
|---|---|---|
| `COINS_PER_PRODUCTIVE_MINUTE` | `2` | ritmo de ingreso |
| `CONDITION_LOSS_PER_DISTRACTING_MINUTE` | `1` | ~100 min de distracción ⇒ ciudad en ruinas |
| `COINS_PER_CONDITION_POINT` | `1` | reparar 1% de condición cuesta 1 moneda |
| `BASE_BUILDING_COST` | `10` | costo del 1er edificio (después ×2 por compra) |
| `BUILDINGS_PER_LEVEL` | `3` | cada 3 edificios sube un nivel |

---

## 6. Quién escribe: el service worker es el único escritor

El spec base define **"un solo escritor"** (el SW). Comprar y reparar los dispara el usuario desde el popup, pero **el popup no escribe estado de ciudad**: manda un mensaje y el SW lo aplica.

```
popup  ──chrome.runtime.sendMessage(CityAction)──►  service worker
                                                        │ valida + aplica función pura
                                                        │ persiste (serializado, ver abajo)
                                                        ▼
popup  ◄──── chrome.storage.onChanged ──── storage.local
```

- El popup manda `{ type: 'BUY_BUILDING' }` o `{ type: 'REPAIR', coins }`. El SW recibe en `chrome.runtime.onMessage`, valida (`canBuy` / clampa el repair), aplica la función pura de `core/economy`, persiste vía `storage/`.
- El popup se entera por `chrome.storage.onChanged` (igual que hoy).
- **Serialización:** dentro del SW, el flush del tracking y las acciones del usuario comparten una **cola de escritura** (promise-chain) para que dos `updateState` (load→modify→save) no se pisen y pierdan datos. Es barato (~3 líneas) y elimina las carreras dentro del SW.
- **Excepción consciente:** el onboarding ya escribe directo desde el popup vía `updateState` (una sola vez, antes de que el tracking importe). Se deja como está; no participa de la economía.

---

## 7. Flujo de datos completo

```
[tab activa + idle] ──delta de segundos por categoría (tick / chrome.alarms)──►
service worker ──► classify(domain, userRules)
      ├─ productive  → economy.applyProductiveTime(city, delta)   → +coins
      ├─ distracting → economy.applyDistractingTime(city, delta)  → −condition
      └─ neutral     → (nada)
      │
      ▼ (vía cola de escritura)
storage.local ──(onChanged)──► popup (Home)
      ├─ muestra Math.floor(coins) como "RENORIA POINTS"
      ├─ CityCanvas ruinLevel = 1 − condition/100
      ├─ botón "Construir (buildingCost)"  → sendMessage BUY_BUILDING
      └─ botón "Reparar"                   → sendMessage REPAIR { coins }
```

- El SW acumula tiempo por dominio con `core/tracker.ts` (`recordTime`, puro) y aplica la economía por categoría con el **delta** de segundos desde el último flush (nunca re-aplica el acumulado del día).
- `coins` / `buildings` / `condition` son **acumulativos entre días** (viven en `CityState`). El rollover solo resetea `FocusStats`.

---

## 8. Integración con el render existente (`condition → ruinLevel`)

`CityCanvas` ya soporta `ruinLevel` (0..1). La economía lo alimenta con la **condición persistente**:

```
ruinLevel = clamp(1 - condition / 100, 0, 1)
```

Esto **reemplaza** la derivación actual de `Home.tsx` (que calcula la ruina con el ratio de distracción *del día*, sin reparación). Con la economía, la ruina es persistente y se revierte reparando. El "RENORIA POINTS" del header pasa a mostrar `Math.floor(coins)`.

---

## 9. Alcance

**En este plan:**
- `core/types.ts`: nuevo `CityState` + tipo `CityAction`; migrar los 3 consumidores de `growthPoints`.
- `core/balance.ts` (constantes de §5).
- `core/economy.ts` (funciones puras de §4) + tests TDD.
- `core/tracker.ts` (`recordTime`, puro) + tests TDD.
- `core/defaults.ts`: `emptyCity()` al shape nuevo.
- `entrypoints/background.ts`: construir el service worker de tracking (tabs/idle/alarms) + aplicar economía por categoría + manejar `CityAction` (`onMessage`) como único escritor con cola de escritura.
- `entrypoints/popup/Home.tsx`: mostrar `coins` (floor), `ruinLevel = 1 − condition/100`, botones **Construir** y **Reparar** que mandan `CityAction`.

**Fuera de alcance (diferido):**
- **Catálogo tipado de edificios** (ver §10). Hoy `buildings` es un contador abstracto.
- Curva de niveles / recompensas por nivel más allá de `levelFromBuildings`.
- Selector de monto explícito para reparación parcial (el MVP repara "lo que alcance hasta 100%").
- Cola de escritura más robusta (lock con reintento) — el promise-chain del MVP alcanza.
- Sync entre dispositivos.

---

## 10. Evolución planificada: catálogo de edificios

El usuario confirmó que más adelante los edificios serán un **catálogo tipado** (no un contador). Para que ese cambio sea localizado:

- El **seam** es `buildingCost` + `buyBuilding`, hoy sobre un contador `buildings: number`.
- Cuando llegue el catálogo, `buyBuilding` recibirá un **tipo/ID de edificio** y `CityState` guardará una estructura más rica (p. ej. `built: BuildingId[]`), mientras el resto de la economía (ingreso, condición, reparación) **no cambia**.
- Mantener toda la matemática de costo en `core/economy.ts` + `core/balance.ts` (no esparcida en el SW ni en el popup) es lo que hace barato el reemplazo.

---

## 11. Testing

Sin TDD (no test-first): los tests se escriben **después** de implementar, como verificación. Foco en los módulos puros (`core/economy.ts`, `core/tracker.ts`) — sin mocks de Chrome:

- **`applyProductiveTime`**: suma proporcional al delta; 0/negativo → sin cambio; no toca `condition`.
- **`applyDistractingTime`**: baja `condition` proporcional al delta; **piso en 0**; no toca `coins`.
- **`buildingCost`**: 0→10, 1→20, 2→40.
- **`canBuy` / `buyBuilding`**: con monedas descuenta + suma edificio + recalcula `level`; sin monedas → sin cambios.
- **`levelFromBuildings`**: 0–2 → nivel 1; 3 → nivel 2.
- **`repairCost`**: `condition=100` → 0; `condition=60` → 40.
- **`repair` (parcial)**: gasto menor que `repairCost` sube parcialmente; gasto de más se clampa (tope 100, no más que `repairCost`); clampa al balance disponible; sin monedas → sin cambio.
- **`recordTime`** (tracker): suma al contador de la categoría y al dominio; acumula sobre dominio existente; ignora `seconds<=0` y dominio vacío; no muta.

Tracking en el SW y botones del popup: **verificación manual** cargando la extensión (depende de APIs del navegador), igual que en el spec base.
