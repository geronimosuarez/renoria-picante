# New Tab muestra la ciudad — Diseño

**Fecha:** 2026-05-28
**Estado:** Implementado
**Specs base:**
- `docs/superpowers/specs/2026-05-28-renoria-picante-chrome-extension-design.md`
- `docs/superpowers/specs/2026-05-28-economia-puntuacion-design.md`

## Objetivo

Que cada vez que el usuario abra una pestaña nueva vea su ciudad de Renoria, como
recordatorio glanceable de cómo va su foco. Reemplaza la New Tab Page por defecto
de Chrome con la app de la extensión.

## Decisión de producto

| Decisión | Elegido |
|---|---|
| Qué se muestra | **Home completo** (la misma vista del popup): ciudad 3D + HUD de puntos + Level + stats del día + botón Market |
| Navegación | Reusa el ruteo de `App` (Home ↔ Market); el botón Market funciona in-tab |
| Sin onboardear | Muestra el Onboarding (mismo gate que el popup) |
| Layout | Viewport completo (`100vw × 100vh`) — el del popup es fijo `400×600` |

## Mecanismo

WXT detecta el entrypoint `entrypoints/newtab/` y genera solo
`chrome_url_overrides.newtab` en el manifest. No hace falta tocar `wxt.config.ts`.

```
entrypoints/newtab/
  index.html   → monta #root, carga main.tsx (mismas fuentes que el popup)
  main.tsx     → createRoot(...).render(<App/>)  (App importada de ../popup/App)
  style.css    → html/body/#root a 100vw × 100vh
```

## Reuso (clave del diseño)

El newtab **importa la misma `App`** que el popup (`entrypoints/popup/App.tsx`) en
vez de duplicar lógica. Consecuencias:

- Hereda gratis todo el comportamiento del popup: gate de onboarding, ruteo
  Home/Market, puntos en vivo (`useLivePoints`), el `FLUSH` periódico al SW, etc.
- El bundler deduplica: `App` queda en un chunk compartido; los entrypoints
  `popup` y `newtab` pesan ~190 B cada uno y lo referencian (sin duplicar el
  bundle pesado de three.js/React).
- **No se movieron** `App.tsx` ni `Home.tsx` (el import cross-entrypoint es
  idiomático en WXT y evita churn sobre archivos en edición activa).

## Layout a pantalla completa

`Home` ya usa `width/height: 100%` y `CityCanvas` toma el tamaño del contenedor
(`clientWidth/clientHeight`), así que estira a viewport completo sin tocar los
componentes. El `style.css` del newtab fija `100vw × 100vh` (el del popup usa el
tamaño fijo de la ventana de popup).

## Estado en vivo

Igual que el popup: `App` se suscribe a `storage.onChanged`, así cuando el SW
flushea puntos la New Tab se actualiza sola, y `useLivePoints` suaviza el conteo
entre flushes. El `FLUSH` que el popup pide al abrir también aplica acá.

## Testing

- `tests/newtab.test.tsx`: guard de que la superficie New Tab monta la app
  completa (onboarding para usuario nuevo; ciudad para onboardeado). Detecta una
  rotura del reuso sin tener que abrir el navegador.
- Verificación de wiring (build): el manifest incluye
  `chrome_url_overrides.newtab = "newtab.html"` y se emite `newtab.html`.
- Verificación manual: cargar la extensión y abrir una pestaña nueva → se ve la
  ciudad; el botón Market navega; el contador sube en vivo en sitios productivos.

## Fuera de alcance (diferido)

- Rediseño del layout pensado para pantalla grande (v1 reusa el del popup
  estirado; en monitores grandes se ve algo espaciado pero funcional).
- Levantar `App`/`Home` a `components/renoria/` como shell compartido formal
  (hoy el reuso es por import cross-entrypoint; sirve igual).
