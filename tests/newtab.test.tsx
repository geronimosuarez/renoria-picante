import { beforeEach, describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { fakeBrowser } from 'wxt/testing';
import { App } from '../entrypoints/popup/App';
import { initialState } from '../core/defaults';

// La New Tab (entrypoints/newtab/main.tsx) monta exactamente la misma `App`
// que el popup, a viewport completo. Estos guards aseguran que la superficie
// "pestaña nueva" reusa la app completa (gate de onboarding + ciudad), así un
// cambio que rompa el reuso se detecta acá y no recién en el navegador.
describe('superficie New Tab', () => {
  beforeEach(() => {
    fakeBrowser.reset();
  });

  it('usuario sin onboardear → muestra el onboarding', async () => {
    render(<App />);
    expect(await screen.findByText(/Grow Renoria/i)).toBeTruthy();
  });

  it('usuario onboardeado → muestra la ciudad (Home), no el onboarding', async () => {
    await fakeBrowser.storage.local.set({
      renoria_state: { ...initialState('2026-05-28'), onboarded: true },
    });
    render(<App />);
    expect(await screen.findByText(/Today/i)).toBeTruthy();
    expect(screen.queryByText(/Grow Renoria/i)).toBeNull();
  });
});
