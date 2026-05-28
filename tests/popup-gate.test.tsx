import { beforeEach, describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { fakeBrowser } from 'wxt/testing';
import { App } from '../entrypoints/popup/App';
import { initialState } from '../core/defaults';

beforeEach(() => {
  fakeBrowser.reset();
});

describe('gate del onboarding en el popup', () => {
  it('muestra el onboarding cuando onboarded === false', async () => {
    render(<App />);
    expect(await screen.findByText(/Grow Renoria/i)).toBeTruthy();
  });

  it('muestra la ciudad (no el onboarding) cuando onboarded === true', async () => {
    const state = { ...initialState('2026-05-28'), onboarded: true };
    await fakeBrowser.storage.local.set({ renoria_state: state });
    render(<App />);
    expect(await screen.findByText(/Today/i)).toBeTruthy();
    expect(screen.queryByText(/Grow Renoria/i)).toBeNull();
  });
});
