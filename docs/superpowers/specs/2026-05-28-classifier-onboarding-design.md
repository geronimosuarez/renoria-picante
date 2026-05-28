# Clasificación dirigida por el usuario + Onboarding — Diseño

**Fecha:** 2026-05-28
**Estado:** Aprobado para escribir plan de implementación
**Spec base:** `docs/superpowers/specs/2026-05-28-renoria-picante-chrome-extension-design.md`

## Relación con el spec base

Este documento **refina y reemplaza** la sección de clasificación del spec base. El spec base decía "predefinido + ajustable" (defaults del sistema + overrides). Esta decisión cambia: la clasificación en runtime es **100% dirigida por el usuario**. La lista curada del sistema deja de ser un fallback de clasificación y pasa a ser **solo la semilla de sugerencias del onboarding**.

En el plan de implementación base, esto **reemplaza la Task 3** (que mezclaba `DEFAULT_RULES` en `classify`). El scoring de puntos (`core/growth`) queda **pausado** y fuera de alcance de este plan.

---

## 1. Resumen

El usuario decide la categoría de cada sitio. La primera vez que abre el popup, un **onboarding** le presenta una lista curada de sitios comunes con una sugerencia de categoría; el usuario confirma o ajusta. El resultado se guarda como las reglas del usuario (`userRules`). Cualquier sitio sin regla del usuario es **neutral**.

## 2. Decisiones de producto (output del brainstorm)

| Decisión | Elegido |
|---|---|
| Origen de los sitios del onboarding | **Lista curada pre-armada** (~15-20 sitios comunes), sin permisos extra |
| Sitio nunca categorizado por el usuario | **Neutral** (sin fallback a defaults del sistema) |
| Categorías que elige el usuario | **Productivo / Neutral / Distractor** (sugerencia binaria; neutral = "no crea regla") |
| Lugar del onboarding | **Dentro del popup**, la primera vez |
| Re-categorizar después / re-hacer onboarding | **Diferido** (no en este plan) |

## 3. Classifier (runtime)

Módulo puro `core/classifier.ts`:

```ts
classify(domain: string, userRules: CategoryRule[]): SiteCategory
```

- Recorre **solo** `userRules`. Un dominio matchea una regla si es igual al `pattern` o un subdominio de él (`domain === pattern || domain.endsWith('.' + pattern)`).
- Primer match gana → devuelve esa categoría.
- Sin match (o dominio vacío) → **`'neutral'`**.
- **No** se mezclan defaults del sistema. La única fuente de verdad es `userRules`.

`domainFromUrl(url)` se mantiene igual que en el plan base (extrae el dominio sin `www`, devuelve `''` para URLs no http(s)).

## 4. Lista curada (semilla del onboarding)

`core/curated.ts`:

```ts
export const CURATED_SITES: CuratedSite[] = [
  { pattern: 'github.com', suggested: 'productive' },
  { pattern: 'stackoverflow.com', suggested: 'productive' },
  { pattern: 'developer.mozilla.org', suggested: 'productive' },
  { pattern: 'docs.google.com', suggested: 'productive' },
  { pattern: 'notion.so', suggested: 'productive' },
  { pattern: 'linear.app', suggested: 'productive' },
  { pattern: 'figma.com', suggested: 'productive' },
  { pattern: 'chatgpt.com', suggested: 'productive' },
  { pattern: 'youtube.com', suggested: 'distracting' },
  { pattern: 'instagram.com', suggested: 'distracting' },
  { pattern: 'tiktok.com', suggested: 'distracting' },
  { pattern: 'x.com', suggested: 'distracting' },
  { pattern: 'twitter.com', suggested: 'distracting' },
  { pattern: 'facebook.com', suggested: 'distracting' },
  { pattern: 'reddit.com', suggested: 'distracting' },
  { pattern: 'netflix.com', suggested: 'distracting' },
];
```

Solo alimenta la UI del onboarding. No participa de `classify`.

## 5. Onboarding (popup, primera vez)

- El popup lee `PersistedState`. Si `onboarded === false` → renderiza `<Onboarding>` en lugar de la ciudad.
- El onboarding muestra cada `CuratedSite` con un control de **3 estados** (`Productivo | Neutral | Distractor`), pre-seteado en `suggested`.
- El usuario ajusta lo que quiera y confirma.
- Al confirmar:
  1. Transforma las selecciones en `userRules` con `buildUserRules`.
  2. Persiste `userRules` y setea `onboarded = true`.
- A partir de ahí el popup muestra la ciudad normalmente.

Lógica pura y testeable:

```ts
// selections: Record<pattern, SiteCategory>
buildUserRules(selections: Record<string, SiteCategory>): CategoryRule[]
```

- Descarta las entradas `'neutral'` (no generan regla).
- Mapea el resto a `{ pattern, category }`.

## 6. Cambios al modelo de datos (`core/types.ts`)

- Agregar `onboarded: boolean` a `PersistedState` (gate del onboarding). El estado inicial arranca en `false`.
- Nuevo tipo:

```ts
export interface CuratedSite {
  pattern: string;
  suggested: 'productive' | 'distracting';
}
```

- `userRules: CategoryRule[]` ya existe → lo llena el onboarding.

## 7. Flujo de datos

```
Popup onboarding → buildUserRules() → storage (userRules + onboarded=true)
                                            ↓
       background: classify(domain, userRules) → 'neutral' si no hay regla
```

## 8. Testing (TDD)

- **`classify`**: match exacto; match de subdominio; fallback `neutral` sin reglas; primer match gana.
- **`buildUserRules`**: descarta neutrales; mapea productive/distracting; objeto vacío → `[]`.
- **Onboarding (render)**: con `onboarded === false` el popup muestra el onboarding; al confirmar persiste `userRules` y `onboarded`.
- **Gate**: con `onboarded === true` el popup muestra la ciudad, no el onboarding.

## 9. Alcance

**En este plan:** `classify` (user-driven, fallback neutral), `core/curated.ts`, `buildUserRules`, UI de onboarding en el popup, flag `onboarded` en el modelo, y sus tests.

**Fuera de alcance (diferido):**
- Scoring de puntos / `core/growth` (pausado a pedido del usuario).
- Re-categorizar sitios después del onboarding (options page).
- Re-hacer / resetear el onboarding.
- Sitios sugeridos a partir del historial o `topSites` (se descartó por privacidad/permisos).
