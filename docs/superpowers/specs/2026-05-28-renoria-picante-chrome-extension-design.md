# Renoria Picante — Diseño técnico de la extensión de Chrome

**Fecha:** 2026-05-28
**Estado:** Aprobado para escribir plan de implementación
**Objetivo del documento:** Definir *cómo crear* la extensión y los primeros pasos para que el equipo arranque en paralelo.

---

## 1. Resumen del producto

Extensión de Chrome donde una **ciudad crece a medida que el usuario se enfoca**. El crecimiento es automático: la extensión observa de forma **pasiva** en qué sitios pasa tiempo el usuario, los clasifica, y convierte el tiempo de foco productivo en crecimiento de la ciudad.

Decisiones de producto tomadas en el brainstorming:

| Decisión | Elección |
|---|---|
| Medición de foco | **Tracking pasivo** de sitios (sin que el usuario inicie nada) |
| Clasificación de sitios | **Predefinida + ajustable** (defaults out-of-the-box, el usuario puede recategorizar) |
| Superficie principal de la UI | **Popup del ícono** |
| Render visual de la ciudad | **Sin definir a propósito** → se trata como pieza enchufable |

> El diseño visual de la ciudad se decide más adelante. Este spec garantiza que esa decisión **no bloquea nada** del resto del desarrollo.

---

## 2. Stack y herramientas

- **Framework de extensión:** [WXT](https://wxt.dev) (sobre Vite + React + TypeScript).
  - Genera `manifest` y entrypoints por convención, HMR pulido, multi-navegador, mantenimiento activo.
- **UI:** React + TypeScript.
- **Build/bundler:** Vite (provisto por WXT).
- **Tests:** Vitest (foco en los módulos puros de `core/`).
- **Calidad:** ESLint + Prettier.
- **Manifest:** **V3** (obligatorio en Chrome).

---

## 3. Principio de arquitectura

> **Núcleo puro + render enchufable + un solo escritor.**

- La lógica de negocio (medir, clasificar, calcular crecimiento) vive en módulos **puros de TS** en `core/`, sin dependencias de Chrome ni de React ni del aspecto visual.
- El **service worker es el único que escribe** estado. El popup solo **lee** y se **suscribe** a cambios.
- El renderizador de la ciudad **consume un `CityState` como dato**. Hoy es un placeholder; cuando se defina el arte real, se cambia un solo componente.

Beneficios: el `core/` es 100% testeable sin mocks de Chrome; el estado es siempre consistente (un único escritor); el diseño visual queda desacoplado y postergable.

---

## 4. Componentes

| Componente | Qué hace | Depende de |
|---|---|---|
| **Service worker** (`entrypoints/background.ts`) | Escucha tab activa + estado idle, acumula tiempo por dominio, persiste | Chrome APIs (`tabs`, `idle`, `alarms`, `storage`) |
| **`core/classifier`** | Dominio → categoría (productive/distracting/neutral) con defaults + overrides | nada (puro, testeable) |
| **`core/growth`** | Convierte tiempo de foco productivo en crecimiento (`CityState`) | nada (puro, testeable) |
| **`storage/storage`** | Wrapper tipado sobre `chrome.storage.local`, única fuente de verdad | Chrome `storage` |
| **Popup** (`entrypoints/popup/`) | Muestra la ciudad + stats del día, escucha cambios en vivo | core + storage |
| **`CityView`** (`components/CityView.tsx`) | Dibuja la ciudad. **Hoy es un stub**; se define después | recibe `CityState` por props |
| **`FocusStats`** (`components/FocusStats.tsx`) | Muestra tiempo productivo/distractor del día | recibe `FocusStats` por props |

---

## 5. Modelo de datos (contrato compartido)

`core/types.ts` es **lo primero que el equipo acuerda**: desbloquea los tres frentes de trabajo en simultáneo.

```ts
// Clasificación de un sitio
export type SiteCategory = 'productive' | 'distracting' | 'neutral';

// Regla de clasificación (default del sistema u override del usuario)
export interface CategoryRule {
  pattern: string;        // dominio, ej "youtube.com"
  category: SiteCategory;
}

// Tiempo acumulado por dominio
export interface DomainTime {
  domain: string;
  category: SiteCategory;
  seconds: number;
}

// Stats de foco de un día
export interface FocusStats {
  date: string;           // YYYY-MM-DD
  productiveSeconds: number;
  distractingSeconds: number;
  neutralSeconds: number;
  byDomain: DomainTime[];
}

// Estado de la ciudad — agnóstico al render
export interface CityState {
  growthPoints: number;   // puntos acumulados de foco productivo
  level: number;          // etapa de la ciudad
  buildings: number;      // elementos desbloqueados (abstracto)
}

// Estado persistido completo (en chrome.storage.local)
export interface PersistedState {
  city: CityState;
  today: FocusStats;
  history: FocusStats[];          // días previos
  userRules: CategoryRule[];      // overrides del usuario
  settings: {
    idleThresholdSeconds: number; // umbral para considerar al usuario inactivo
  };
}
```

Funciones puras clave:

- `classify(domain: string, rules: CategoryRule[]): SiteCategory`
- `applyFocusTime(city: CityState, productiveSeconds: number): CityState`

---

## 6. Flujo de datos

```
[tab activa + idle] → service worker → core/classifier → core/growth
        → chrome.storage.local  ──(onChanged)──→  popup React → CityView
```

- El service worker detecta el dominio de la tab activa (`tabs.onActivated`, `tabs.onUpdated`, `windows.onFocusChanged`), pausa el conteo cuando hay idle (`idle.onStateChanged`), acumula tiempo, lo clasifica, aplica el crecimiento y **persiste en `storage.local`**.
- El popup, al abrirse, lee el estado y se suscribe a `chrome.storage.onChanged` para actualizarse en vivo.

**Nota MV3:** los service workers se duermen. Hay que persistir el acumulado con frecuencia y usar `chrome.alarms` (no depender solo de `setInterval`) para el flush periódico y el cambio de día.

---

## 7. Permisos del manifest (V3)

Definidos en `wxt.config.ts` → `manifest.permissions`:

| Permiso | Por qué |
|---|---|
| `storage` | Persistir el estado de la ciudad y las stats |
| `tabs` | Leer la URL de la tab activa para conocer el dominio |
| `idle` | Detectar inactividad/bloqueo y pausar el conteo |
| `alarms` | Flush periódico y rollover de día con el SW dormido |

---

## 8. Estructura del repo

```
renoria-picante/
  wxt.config.ts            # config WXT: manifest (permisos), settings
  package.json
  tsconfig.json
  entrypoints/
    background.ts          # service worker: tabs + idle + alarms
    popup/
      index.html
      main.tsx
      App.tsx
  components/
    CityView.tsx           # ⟵ placeholder (render a definir después)
    FocusStats.tsx
  core/                    # PURO — sin Chrome ni React
    types.ts               # contrato compartido (sección 5)
    classifier.ts
    growth.ts
    defaults.ts            # ruleset de categorías por defecto
  storage/
    storage.ts             # wrapper tipado sobre chrome.storage.local
  tests/
    classifier.test.ts
    growth.test.ts
  public/
    icon/                  # íconos de la extensión
```

---

## 9. Testing

- **Unit (Vitest):** `core/classifier` y `core/growth` son puros → se testean sin mocks de Chrome. Es la base de cobertura.
- **Tracking (service worker):** más difícil de unit-testear (requiere mocks de Chrome APIs). Para el MVP: verificación manual cargando la extensión en `chrome://extensions` (modo desarrollador) + tests ligeros sobre la lógica de acumulación extraída a funciones puras donde se pueda.

---

## 10. División de trabajo (equipo)

Una vez acordado `core/types.ts`, tres frentes avanzan en paralelo:

- **Track A — Motor de tracking:** `entrypoints/background.ts`, eventos de Chrome (tabs/idle/alarms), acumulación de tiempo, persistencia vía `storage/`.
- **Track B — Lógica de negocio:** `core/classifier`, `core/growth`, `core/defaults` + tests. **No necesita Chrome → arranca inmediatamente.**
- **Track C — UI del popup:** `entrypoints/popup/`, integración con `storage/`, `FocusStats`. `CityView` queda como stub que recibe `CityState`.

**Primer hito conjunto:** acordar y mergear `core/types.ts`.

---

## 11. Primeros pasos concretos (día 1)

1. Inicializar el proyecto con WXT (`npx wxt@latest init`, plantilla React + TS).
2. Configurar `wxt.config.ts` con manifest V3 y permisos (`storage`, `tabs`, `idle`, `alarms`).
3. Escribir `core/types.ts` (el contrato de la sección 5) y mergearlo primero.
4. Configurar ESLint + Prettier + Vitest.
5. Repartir Tracks A / B / C entre el equipo y arrancar en paralelo.

---

## 12. Fuera de alcance del MVP (diferido a propósito)

- **Diseño visual real de la ciudad** — `CityView` es un placeholder hasta definir el arte.
- **UI para editar categorías (options page)** — el modelo soporta `userRules` desde el día 1, pero la pantalla para editarlas puede ir en una iteración posterior; el MVP arranca con los defaults.
- **Sync entre dispositivos** (`chrome.storage.sync`) y **publicación multi-navegador**.
- **Detalle del balance de crecimiento** (cuántos puntos por minuto, curva de niveles) — se afina con datos reales tras el MVP.
